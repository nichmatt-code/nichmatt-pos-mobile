import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, getProducts } from '../api/catalog';
import { checkout } from '../api/transactions';
import { claimSelfOrder } from '../api/selfOrders';
import { checkCoupon } from '../api/coupons';
import { previewBill } from '../api/billPreview';
import { searchCustomers } from '../api/customers';
import { logout } from '../api/auth';
import { ApiError } from '../api/client';
import { formatRupiah } from '../utils/currency';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import {
  BillPreview,
  CartItem,
  Category,
  CouponCheckResult,
  Customer,
  PaymentMethod,
  Product,
  SelfOrderClaim,
  Transaction,
  User,
} from '../types';
import CheckoutModal from '../components/CheckoutModal';
import AddToCartModal from '../components/AddToCartModal';
import CartModal from '../components/CartModal';
import SelfOrderQrModal from '../components/SelfOrderQrModal';
import BillPreviewModal from '../components/BillPreviewModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import LossRecordModal from '../components/LossRecordModal';
import StockOpnameModal from '../components/StockOpnameModal';
import MoreMenuModal from '../components/MoreMenuModal';
import Toast, { ToastPayload } from '../components/Toast';

interface Props {
  user: User;
  // Dipanggil setelah logout selesai, supaya App.tsx tahu harus kembali
  // menampilkan LoginScreen.
  onLogout: () => void;
}

export default function KasirScreen({ user, onLogout }: Props) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // --- Data katalog (kategori & produk) dari server ------------------
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Keranjang & pembayaran -----------------------------------------
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  // Diisi setelah checkout sukses - selama ada isinya, CheckoutModal
  // menampilkan layar "Transaksi Berhasil" alih-alih form pembayaran.
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  // Notifikasi kecil "X ditambahkan ke keranjang" di pojok bawah layar.
  const [toast, setToast] = useState<ToastPayload | null>(null);
  // Produk yang baru saja disentuh - selama ada isinya, popup konfirmasi
  // qty & catatan muncul sebelum benar-benar masuk ke keranjang.
  const [productBeingAdded, setProductBeingAdded] = useState<Product | null>(null);

  // --- QR self order ---------------------------------------------------
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);

  // --- Riwayat transaksi -------------------------------------------------
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // --- Catat Kerugian ------------------------------------------------------
  const [isLossRecordVisible, setIsLossRecordVisible] = useState(false);

  // --- Stock Opname --------------------------------------------------------
  const [isStockOpnameVisible, setIsStockOpnameVisible] = useState(false);
  const canAccessStockOpname = user.role === 'owner' || user.permissions.includes('stock-opname');

  // --- Menu navbar (☰) -----------------------------------------------------
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  // --- Klaim kode self order --------------------------------------------
  const [orderCodeInput, setOrderCodeInput] = useState('');
  const [isClaimingSelfOrder, setIsClaimingSelfOrder] = useState(false);
  const [selfOrderError, setSelfOrderError] = useState<string | null>(null);
  // Diisi setelah kode berhasil diklaim - dipakai supaya checkout tahu
  // transaksi ini terkait self order yang mana.
  const [claimedSelfOrder, setClaimedSelfOrder] = useState<SelfOrderClaim | null>(null);

  // --- Pelanggan/member ---------------------------------------------------
  const [customerName, setCustomerNameState] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const debouncedCustomerName = useDebouncedValue(customerName, 400);

  // --- Catatan pesanan keseluruhan (bukan per-produk) --------------------
  const [orderNote, setOrderNote] = useState('');

  // --- Kupon -------------------------------------------------------------
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCheckResult | null>(null);

  // --- Cetak Bill (pratinjau, belum dibayar) -----------------------------
  const [billPreview, setBillPreview] = useState<BillPreview | null>(null);
  const [isLoadingBillPreview, setIsLoadingBillPreview] = useState(false);

  // Dipakai sesaat sebelum modal pembayaran dibuka, supaya "kembalian"
  // dihitung dari total yang BENAR (sudah termasuk diskon kupon, pajak,
  // dan service charge) - bukan cuma jumlah harga produk mentah.
  const [checkoutTotal, setCheckoutTotal] = useState<number | null>(null);
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false);

  // Ambil daftar kategori sekali saja saat layar ini pertama kali muncul.
  // Array kosong `[]` di akhir useEffect artinya "jalankan cuma sekali".
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {
        // Kategori gagal dimuat bukan hal fatal - kasir masih bisa lanjut
        // lihat semua produk tanpa filter kategori.
      });
  }, []);

  // Ambil ulang daftar produk setiap kali kategori yang dipilih berubah,
  // setiap kali kata pencarian (setelah di-debounce) berubah, atau saat
  // tombol "Coba Lagi" ditekan (lewat reloadToken).
  const debouncedSearch = useDebouncedValue(search, 400);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    // Reset status loading/error di awal setiap kali efek ini jalan ulang
    // (ganti kategori, ganti kata pencarian, dll) - pola standar untuk
    // effect yang mengambil data, makanya baris ini sengaja dikecualikan
    // dari aturan lint yang menganggap setState di awal effect berisiko.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingProducts(true);
    setLoadError(null);

    getProducts({ search: debouncedSearch, categoryId: selectedCategoryId })
      .then(result => {
        if (!isCancelled) {
          setProducts(result);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat produk.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingProducts(false);
        }
      });

    // Fungsi ini dipanggil React kalau efek di atas dijalankan ulang
    // sebelum request sebelumnya selesai (misalnya user ganti kategori
    // dengan cepat) - mencegah hasil request LAMA menimpa hasil yang BARU.
    return () => {
      isCancelled = true;
    };
  }, [selectedCategoryId, debouncedSearch, reloadToken]);

  // Kelompokkan produk berdasarkan kategorinya (meniru tampilan web, yang
  // menampilkan produk per-kategori dengan judul di atasnya) - dihitung
  // ulang cuma kalau daftar produk atau kategori berubah, bukan tiap render.
  const productSections = useMemo(
    () => groupProductsByCategory(products, categories),
    [products, categories],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.qty, 0),
    [cart],
  );
  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);
  // Perkiraan di layar SAJA (belum termasuk pajak/service charge kalau
  // toko punya itu) - total yang BENAR untuk pembayaran selalu dihitung
  // ulang dari server tepat sebelum modal pembayaran dibuka.
  const estimatedTotal = Math.max(0, cartTotal - (appliedCoupon?.discount_amount ?? 0));

  function addToCart(product: Product, qty: number, note: string) {
    setCart(current => {
      const existing = current.find(line => line.product.id === product.id);

      if (existing) {
        // Produk yang sama ditambah lagi: qty digabung, catatan terbaru
        // yang dipakai (menimpa catatan lama) supaya tetap satu baris per
        // produk di keranjang, bukan baris duplikat. Harga yang sudah
        // diedit manual (kalau ada) TETAP dipakai, tidak ikut ketimpa.
        return current.map(line =>
          line.product.id === product.id ? { ...line, qty: line.qty + qty, note } : line,
        );
      }

      return [...current, { product, qty, note, price: product.price }];
    });

    // `id: Date.now()` supaya toast yang sama persis (tap produk yang sama
    // dua kali berturut-turut) tetap mengulang animasi dari awal.
    setToast({ id: Date.now(), message: `${product.name} ditambahkan ke keranjang` });
  }

  function handleConfirmAddToCart(qty: number, note: string) {
    if (productBeingAdded) {
      addToCart(productBeingAdded, qty, note);
    }

    setProductBeingAdded(null);
  }

  function changeQty(productId: number, delta: number) {
    setCart(current =>
      current
        .map(line => (line.product.id === productId ? { ...line, qty: line.qty + delta } : line))
        // Buang baris yang qty-nya jadi 0 atau kurang.
        .filter(line => line.qty > 0),
    );
  }

  /**
   * Ubah harga satu baris keranjang secara manual - cuma dipanggil kalau
   * `user.store.allow_price_edit` true (lihat CartRow). Nilai negatif/aneh
   * dari input diabaikan (dianggap 0) supaya subtotal tidak pernah rusak.
   */
  function updateCartLinePrice(productId: number, priceText: string) {
    const price = Math.max(0, Number(priceText.replace(/[^0-9]/g, '')) || 0);

    setCart(current =>
      current.map(line => (line.product.id === productId ? { ...line, price } : line)),
    );
  }

  function updateCartLineNote(productId: number, note: string) {
    setCart(current =>
      current.map(line => (line.product.id === productId ? { ...line, note } : line)),
    );
  }

  // Cari pelanggan/member setiap kali nama yang diketik berubah (setelah
  // di-debounce) - tapi TIDAK kalau sudah ada pelanggan yang dipilih dari
  // daftar hasil pencarian (supaya dropdown tidak muncul lagi begitu
  // namanya sudah diisi otomatis dari hasil pilihan).
  useEffect(() => {
    if (selectedCustomerId || debouncedCustomerName.trim() === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomerMatches([]);
      return;
    }

    let isCancelled = false;
    setIsSearchingCustomer(true);

    searchCustomers(debouncedCustomerName.trim())
      .then(results => {
        if (!isCancelled) {
          setCustomerMatches(results);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCustomerMatches([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSearchingCustomer(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedCustomerName, selectedCustomerId]);

  function handleCustomerNameChange(text: string) {
    setCustomerNameState(text);
    // Ketik lagi setelah sebelumnya memilih dari daftar berarti user mau
    // ganti - lepas dulu pilihan lamanya supaya pencarian aktif lagi.
    setSelectedCustomerId(null);
  }

  function handleSelectCustomer(customerItem: Customer) {
    setSelectedCustomerId(customerItem.id);
    setCustomerNameState(customerItem.name);
    setCustomerMatches([]);
  }

  function handleClearCustomer() {
    setSelectedCustomerId(null);
    setCustomerNameState('');
    setCustomerMatches([]);
  }

  /** Item keranjang dalam bentuk yang dipakai bersama oleh preview bill & checkout. */
  function cartItemsPayload() {
    return cart.map(line => ({
      product_id: line.product.id,
      qty: line.qty,
      note: line.note || undefined,
      price: line.price,
    }));
  }

  async function handleClaimSelfOrder() {
    const code = orderCodeInput.trim();

    if (!code) {
      return;
    }

    setSelfOrderError(null);
    setIsClaimingSelfOrder(true);

    try {
      const claim = await claimSelfOrder(code);

      // Gabungkan item dari self order ke keranjang yang sedang berjalan -
      // pakai logika yang sama seperti nambah produk manual (qty digabung
      // kalau produknya sudah ada), tapi tanpa memicu toast satu-satu per
      // item supaya tidak spam notifikasi.
      setCart(current => {
        let next = current;

        for (const item of claim.items) {
          const existing = next.find(line => line.product.id === item.product_id);

          if (existing) {
            next = next.map(line =>
              line.product.id === item.product_id
                ? { ...line, qty: line.qty + item.qty, note: item.note || line.note }
                : line,
            );
          } else {
            next = [
              ...next,
              {
                // Self order cuma kasih id/nama/harga/qty produk, bukan
                // objek Product lengkap - field lain diisi placeholder
                // aman karena tidak dipakai lagi setelah di keranjang.
                product: {
                  id: item.product_id,
                  category_id: null,
                  name: item.name,
                  description: null,
                  sku: null,
                  barcode: null,
                  price: item.price,
                  stock_qty: item.qty,
                  unit: null,
                  image_url: null,
                  is_unlimited_stock: true,
                  is_available: true,
                },
                qty: item.qty,
                note: item.note,
                price: item.price,
              },
            ];
          }
        }

        return next;
      });

      setClaimedSelfOrder(claim);
      setOrderCodeInput('');

      // Isi otomatis nama pelanggan & catatan dari self order, kalau ada -
      // kasir masih bisa mengubahnya manual sesudahnya kalau perlu.
      if (claim.customer_name) {
        setCustomerNameState(claim.customer_name);
      }
      if (claim.note) {
        setOrderNote(claim.note);
      }

      if (claim.skipped.length > 0) {
        Alert.alert(
          'Sebagian menu dilewati',
          `Menu berikut sudah tidak tersedia: ${claim.skipped.join(', ')}`,
        );
      }
    } catch (error) {
      setSelfOrderError(error instanceof ApiError ? error.message : 'Gagal mengambil kode.');
    } finally {
      setIsClaimingSelfOrder(false);
    }
  }

  async function handleApplyCoupon() {
    const code = couponCodeInput.trim();

    if (!code || cartTotal <= 0) {
      return;
    }

    setCouponError(null);
    setIsCheckingCoupon(true);

    try {
      const result = await checkCoupon(code, cartTotal);
      setAppliedCoupon(result);
      setCouponCodeInput('');
    } catch (error) {
      setCouponError(error instanceof ApiError ? error.message : 'Kupon tidak valid.');
    } finally {
      setIsCheckingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  async function handleShowBillPreview() {
    setIsLoadingBillPreview(true);

    try {
      const preview = await previewBill({
        items: cartItemsPayload(),
        coupon_code: appliedCoupon?.code,
        customer_name: customerName.trim() || undefined,
        note: orderNote.trim() || undefined,
      });
      setBillPreview(preview);
    } catch (error) {
      Alert.alert(
        'Gagal memuat bill',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsLoadingBillPreview(false);
    }
  }

  /**
   * Dipanggil saat tombol "Bayar" ditekan - menghitung total yang BENAR
   * (termasuk diskon kupon/pajak/service charge) dari server dulu,
   * sebelum modal pembayaran (dengan hitungan kembalian) dibuka.
   */
  async function handleOpenCheckout() {
    setIsPreparingCheckout(true);

    try {
      const preview = await previewBill({
        items: cartItemsPayload(),
        coupon_code: appliedCoupon?.code,
        customer_name: customerName.trim() || undefined,
        note: orderNote.trim() || undefined,
      });
      setCheckoutTotal(preview.total);
      setIsCartModalVisible(false);
      setIsCheckoutVisible(true);
    } catch (error) {
      Alert.alert(
        'Tidak bisa lanjut bayar',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsPreparingCheckout(false);
    }
  }

  async function handleConfirmPayment(paymentMethod: PaymentMethod, paidAmount?: number) {
    setIsSubmittingCheckout(true);

    try {
      const transaction = await checkout({
        items: cartItemsPayload(),
        payment_method: paymentMethod,
        paid_amount: paidAmount,
        customer_id: selectedCustomerId ?? undefined,
        customer_name: customerName.trim() || undefined,
        note: orderNote.trim() || undefined,
        coupon_code: appliedCoupon?.code,
        self_order_id: claimedSelfOrder?.self_order_id,
      });

      setCart([]);
      setAppliedCoupon(null);
      setClaimedSelfOrder(null);
      setSelectedCustomerId(null);
      setCustomerNameState('');
      setCustomerMatches([]);
      setOrderNote('');
      // Modal tetap terbuka (isCheckoutVisible tidak diubah), tapi karena
      // completedTransaction sekarang terisi, isinya otomatis berganti
      // jadi layar "Transaksi Berhasil".
      setCompletedTransaction(transaction);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Checkout gagal, coba lagi.';
      Alert.alert('Checkout gagal', message);
    } finally {
      setIsSubmittingCheckout(false);
    }
  }

  function handleCloseCheckout() {
    setIsCheckoutVisible(false);
    setCompletedTransaction(null);
    setCheckoutTotal(null);
  }

  async function handleLogout() {
    Alert.alert('Keluar', 'Yakin mau keluar dari aplikasi kasir?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onLogout();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* --- Navbar (identitas brand, meniru bar atas di versi web) ---- */}
      <View style={styles.navbar}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.navbarLogo}
          resizeMode="contain"
        />
        <View style={styles.navbarActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleTheme}
            accessibilityLabel="Ganti tema gelap/terang">
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={colors.slate[500]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsMoreMenuVisible(true)}
            accessibilityLabel="Buka menu">
            <Ionicons name="menu-outline" size={22} color={colors.slate[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Header halaman ------------------------------------------ */}
      <View style={styles.header}>
        <Text style={styles.title}>Kasir</Text>
        <Text style={styles.subtitle}>Buat transaksi baru untuk pelanggan.</Text>
      </View>

      {/* --- Pencarian + QR self order + Catat Kerugian ---------------- */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari produk..."
            placeholderTextColor={colors.slate[400]}
          />
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => setIsQrModalVisible(true)}
          accessibilityLabel="Tampilkan QR self order">
          <Text style={styles.qrButtonIcon}>▦</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => setIsLossRecordVisible(true)}
          accessibilityLabel="Catat Kerugian">
          <Ionicons name="alert-circle-outline" size={20} color={colors.slate[500]} />
        </TouchableOpacity>
      </View>

      {/* --- Klaim kode self order ------------------------------------- */}
      <View style={styles.selfOrderBox}>
        {claimedSelfOrder ? (
          <View style={styles.selfOrderAppliedRow}>
            <Text style={styles.selfOrderAppliedText}>
              Dari Self Order: {claimedSelfOrder.code}
              {claimedSelfOrder.customer_name ? ` · ${claimedSelfOrder.customer_name}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setClaimedSelfOrder(null)}>
              <Text style={styles.selfOrderRemoveText}>Lepas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inlineInputRow}>
            <TextInput
              style={styles.inlineInput}
              value={orderCodeInput}
              onChangeText={text => setOrderCodeInput(text.toUpperCase())}
              placeholder="Kode self order (mis. A3F9K2)"
              placeholderTextColor={colors.slate[400]}
              autoCapitalize="characters"
              maxLength={6}
              editable={!isClaimingSelfOrder}
            />
            <TouchableOpacity
              style={styles.inlineButton}
              onPress={handleClaimSelfOrder}
              disabled={isClaimingSelfOrder}>
              {isClaimingSelfOrder ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.inlineButtonText}>Ambil</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {!!selfOrderError && <Text style={styles.inlineErrorText}>{selfOrderError}</Text>}
      </View>

      {/* --- Filter kategori (horizontal scroll) --------------------- */}
      {/* Sengaja pakai ScrollView biasa, BUKAN FlatList: daftar kategori
          selalu pendek (tidak butuh virtualisasi), dan FlatList horizontal
          untuk daftar sependek ini justru sering bikin chip-nya tampil
          pudar/kosong di Android sampai disentuh - bug pada mekanisme
          "cell recycling"-nya saat kategori baru selesai dimuat dari
          server. ScrollView menggambar semua chip sekaligus, jadi bug itu
          tidak pernah terjadi. */}
      {/* Dibungkus kartu kecil dengan tinggi TETAP, supaya tampilan di
          sekitarnya tidak ikut naik-turun saat daftar kategori baru
          selesai dimuat dari server atau saat kategori dipilih. */}
      <View style={styles.categoryCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryListContent}>
          <CategoryChip
            label="Semua"
            isActive={selectedCategoryId === null}
            onPress={() => setSelectedCategoryId(null)}
          />
          {categories.map(item => (
            <CategoryChip
              key={item.id}
              label={item.name}
              isActive={selectedCategoryId === item.id}
              onPress={() => setSelectedCategoryId(item.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* --- Daftar produk -------------------------------------------- */}
      {isLoadingProducts ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : loadError ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setReloadToken(t => t + 1)}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={productSections}
          keyExtractor={(row, index) => `row-${index}-${row[0]?.id ?? 'empty'}`}
          contentContainerStyle={styles.productListContent}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Produk tidak ditemukan.</Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item: row }) => (
            <View style={styles.productRow}>
              {row.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => setProductBeingAdded(product)}
                />
              ))}
            </View>
          )}
        />
      )}

      {/* --- Bar ringkas keranjang - tap untuk buka layar keranjang penuh */}
      {cartItemCount > 0 && (
        <TouchableOpacity
          style={styles.cartSummaryBar}
          onPress={() => setIsCartModalVisible(true)}>
          <Text style={styles.cartSummaryCount}>{cartItemCount} item</Text>
          <Text style={styles.cartSummaryText}>
            Lihat Keranjang · {formatRupiah(estimatedTotal)} ›
          </Text>
        </TouchableOpacity>
      )}

      <CartModal
        visible={isCartModalVisible}
        onClose={() => setIsCartModalVisible(false)}
        cart={cart}
        allowPriceEdit={user.store.allow_price_edit}
        onIncrease={id => changeQty(id, 1)}
        onDecrease={id => changeQty(id, -1)}
        onPriceChange={updateCartLinePrice}
        onNoteChange={updateCartLineNote}
        claimedSelfOrder={claimedSelfOrder}
        onRemoveSelfOrder={() => setClaimedSelfOrder(null)}
        customerName={customerName}
        onCustomerNameChange={handleCustomerNameChange}
        selectedCustomerId={selectedCustomerId}
        customerMatches={customerMatches}
        isSearchingCustomer={isSearchingCustomer}
        onSelectCustomer={handleSelectCustomer}
        onClearCustomer={handleClearCustomer}
        orderNote={orderNote}
        onOrderNoteChange={setOrderNote}
        appliedCoupon={appliedCoupon}
        couponCodeInput={couponCodeInput}
        onCouponCodeInputChange={text => setCouponCodeInput(text.toUpperCase())}
        isCheckingCoupon={isCheckingCoupon}
        couponError={couponError}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        onShowBillPreview={handleShowBillPreview}
        cartItemCount={cartItemCount}
        estimatedTotal={estimatedTotal}
        isPreparingCheckout={isPreparingCheckout}
        onOpenCheckout={handleOpenCheckout}
      />

      <AddToCartModal
        // `key` dibuat dari id produk supaya React membuat ulang komponen
        // ini dari nol setiap kali produk yang disentuh beda - itu artinya
        // state qty/catatan di dalamnya otomatis mulai lagi dari awal,
        // tanpa perlu useEffect buat "mereset" secara manual.
        key={productBeingAdded?.id ?? 'none'}
        product={productBeingAdded}
        maxQty={
          productBeingAdded
            ? maxQtyFor(productBeingAdded, cart)
            : Number.POSITIVE_INFINITY
        }
        onClose={() => setProductBeingAdded(null)}
        onConfirm={handleConfirmAddToCart}
      />

      <CheckoutModal
        visible={isCheckoutVisible}
        total={checkoutTotal ?? estimatedTotal}
        isSubmitting={isSubmittingCheckout}
        completedTransaction={completedTransaction}
        onClose={handleCloseCheckout}
        onConfirm={handleConfirmPayment}
      />

      <SelfOrderQrModal
        visible={isQrModalVisible}
        url={user.store.self_order_url}
        onClose={() => setIsQrModalVisible(false)}
      />

      <BillPreviewModal
        bill={billPreview}
        isLoading={isLoadingBillPreview}
        onClose={() => setBillPreview(null)}
      />

      <TransactionHistoryModal
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
      />

      <LossRecordModal
        visible={isLossRecordVisible}
        onClose={() => setIsLossRecordVisible(false)}
      />

      <StockOpnameModal
        visible={isStockOpnameVisible}
        onClose={() => setIsStockOpnameVisible(false)}
      />

      <MoreMenuModal
        visible={isMoreMenuVisible}
        onClose={() => setIsMoreMenuVisible(false)}
        user={user}
        onOpenHistory={() => setIsHistoryVisible(true)}
        onOpenStockOpname={() => setIsStockOpnameVisible(true)}
        canAccessStockOpname={canAccessStockOpname}
        onLogout={handleLogout}
      />

      <Toast toast={toast} bottomOffset={cartItemCount > 0 ? 90 : 24} />
    </SafeAreaView>
  );
}

/**
 * Kartu satu produk di dalam grid. Tekan untuk menambah ke keranjang.
 *
 * Kalau produk punya foto (`image_url` dari server), foto itu yang
 * ditampilkan. Kalau tidak, ditampilkan watermark logo toko yang samar -
 * ini meniru persis fallback punya `<x-product-thumb>` di versi web,
 * supaya produk tanpa foto tidak terlihat kosong/rusak.
 */
function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOutOfStock = !product.is_unlimited_stock && product.stock_qty <= 0;
  const disabled = !product.is_available || isOutOfStock;

  return (
    <TouchableOpacity
      style={[styles.productCard, disabled && styles.productCardDisabled]}
      onPress={onPress}
      disabled={disabled}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.productImageWatermark}
            resizeMode="contain"
          />
        </View>
      )}
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
      <Text style={[styles.productStock, isOutOfStock && styles.productStockLow]}>
        {product.is_unlimited_stock
          ? 'Stok tersedia'
          : isOutOfStock
            ? 'Stok habis'
            : `Stok: ${product.stock_qty}`}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Chip filter kategori. Sengaja dibuat "pil gelap" (slate-900) saat aktif -
 * ini menyalin gaya persis dari filter kategori di kasir versi web, yang
 * memang beda dari warna brand biru supaya kategori terasa "netral"
 * dibanding tombol-tombol aksi (Bayar, dll) yang pakai warna brand.
 */
function CategoryChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
      onPress={onPress}>
      <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface ProductSection {
  title: string;
  data: Product[][];
}

/**
 * Susun produk jadi baris-baris berisi 2 item (buat grid 2 kolom di dalam
 * SectionList - SectionList sendiri tidak punya `numColumns` seperti
 * FlatList, jadi triknya: tiap "item" di section sebenarnya adalah satu
 * BARIS berisi sampai 2 produk).
 */
function chunkIntoPairs(items: Product[]): Product[][] {
  const rows: Product[][] = [];

  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return rows;
}

/**
 * Kelompokkan produk per kategori, dengan urutan kategori mengikuti
 * urutan dari server, dan produk tanpa kategori dikumpulkan di bagian
 * paling akhir - meniru pengelompokan yang sama di kasir versi web.
 */
function groupProductsByCategory(products: Product[], categories: Category[]): ProductSection[] {
  const buckets = new Map<number, Product[]>();
  const uncategorized: Product[] = [];

  for (const product of products) {
    if (product.category_id === null) {
      uncategorized.push(product);
      continue;
    }

    const bucket = buckets.get(product.category_id) ?? [];
    bucket.push(product);
    buckets.set(product.category_id, bucket);
  }

  const sections: ProductSection[] = [];

  for (const category of categories) {
    const items = buckets.get(category.id);

    if (items && items.length > 0) {
      sections.push({ title: category.name, data: chunkIntoPairs(items) });
    }
  }

  if (uncategorized.length > 0) {
    sections.push({ title: 'Tanpa Kategori', data: chunkIntoPairs(uncategorized) });
  }

  return sections;
}

/**
 * Berapa banyak lagi produk ini boleh ditambahkan, dengan memperhitungkan
 * qty yang sudah ada di keranjang (bukan cuma stok mentah dari server).
 */
function maxQtyFor(product: Product, cart: CartItem[]): number {
  if (product.is_unlimited_stock) {
    return Number.POSITIVE_INFINITY;
  }

  const alreadyInCart = cart.find(line => line.product.id === product.id)?.qty ?? 0;

  return Math.max(1, product.stock_qty - alreadyInCart);
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  navbarLogo: {
    width: 110,
    height: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate[900],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.slate[500],
    marginTop: 2,
  },
  navbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  searchWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  qrButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginLeft: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonIcon: {
    fontSize: 18,
    color: colors.slate[600],
  },
  selfOrderBox: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  selfOrderAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.brand[50],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selfOrderAppliedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand[700],
    marginRight: 8,
  },
  selfOrderRemoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.rose[600],
  },
  inlineInputRow: {
    flexDirection: 'row',
  },
  inlineInput: {
    flex: 1,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.slate[900],
    marginRight: 8,
  },
  inlineButton: {
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  inlineErrorText: {
    color: colors.rose[600],
    fontSize: 11,
    marginTop: 4,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    fontSize: 13,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingLeft: 38,
    paddingRight: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.slate[900],
  },
  categoryCard: {
    height: 56,
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    justifyContent: 'center',
  },
  categoryListContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.slate[900],
    borderColor: colors.slate[900],
  },
  categoryChipText: {
    color: colors.slate[500],
    fontWeight: '600',
    fontSize: 13,
  },
  // `slate[50]` (bukan `white` literal) supaya ikut membalik jadi teks
  // gelap kalau tema gelap membuat chip terpilih ini jadi terang.
  categoryChipTextActive: {
    color: colors.slate[50],
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.rose[600],
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.slate[500],
  },
  retryButton: {
    backgroundColor: colors.brand[600],
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  productListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    // Meniru `shadow-card` di web: bayangan tipis di bawah kartu produk.
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  productCardDisabled: {
    opacity: 0.5,
  },
  productImage: {
    height: 84,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.slate[100],
  },
  productImagePlaceholder: {
    height: 84,
    borderRadius: 8,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    padding: 12,
  },
  productImageWatermark: {
    width: '60%',
    height: '60%',
    opacity: 0.3,
    tintColor: colors.slate[400],
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[900],
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand[600],
  },
  productStock: {
    fontSize: 11,
    color: colors.slate[400],
    marginTop: 2,
  },
  productStockLow: {
    color: colors.rose[500],
  },
  cartSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.brand[600],
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cartSummaryCount: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  cartSummaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  });
}
