import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, getProducts } from '../api/catalog';
import { checkout } from '../api/transactions';
import { logout } from '../api/auth';
import { ApiError } from '../api/client';
import { formatRupiah } from '../utils/currency';
import { colors } from '../theme/colors';
import { CartItem, Category, PaymentMethod, Product, Transaction, User } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import Toast, { ToastPayload } from '../components/Toast';

interface Props {
  user: User;
  // Dipanggil setelah logout selesai, supaya App.tsx tahu harus kembali
  // menampilkan LoginScreen.
  onLogout: () => void;
}

export default function KasirScreen({ user, onLogout }: Props) {
  // --- Data katalog (kategori & produk) dari server ------------------
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Keranjang & pembayaran -----------------------------------------
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  // Diisi setelah checkout sukses - selama ada isinya, CheckoutModal
  // menampilkan layar "Transaksi Berhasil" alih-alih form pembayaran.
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  // Notifikasi kecil "X ditambahkan ke keranjang" di pojok bawah layar.
  const [toast, setToast] = useState<ToastPayload | null>(null);

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

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [cart],
  );
  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  function addToCart(product: Product) {
    setCart(current => {
      const existing = current.find(line => line.product.id === product.id);

      if (existing) {
        return current.map(line =>
          line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }

      return [...current, { product, qty: 1 }];
    });

    // `id: Date.now()` supaya toast yang sama persis (tap produk yang sama
    // dua kali berturut-turut) tetap mengulang animasi dari awal. Aman
    // dipakai di sini karena addToCart cuma dipanggil dari onPress, bukan
    // saat render.
    // eslint-disable-next-line react-hooks/purity
    setToast({ id: Date.now(), message: `${product.name} ditambahkan ke keranjang` });
  }

  function changeQty(productId: number, delta: number) {
    setCart(current =>
      current
        .map(line => (line.product.id === productId ? { ...line, qty: line.qty + delta } : line))
        // Buang baris yang qty-nya jadi 0 atau kurang.
        .filter(line => line.qty > 0),
    );
  }

  async function handleConfirmPayment(paymentMethod: PaymentMethod, paidAmount?: number) {
    setIsSubmittingCheckout(true);

    try {
      const transaction = await checkout({
        items: cart.map(line => ({ product_id: line.product.id, qty: line.qty })),
        payment_method: paymentMethod,
        paid_amount: paidAmount,
      });

      setCart([]);
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
      {/* --- Header ------------------------------------------------ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kasir</Text>
          <Text style={styles.subtitle}>
            {user.store.name} · {user.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* --- Pencarian ---------------------------------------------- */}
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

      {/* --- Filter kategori (horizontal scroll) --------------------- */}
      <FlatList
        style={styles.categoryList}
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.categoryListContent}
        ListHeaderComponent={
          <CategoryChip
            label="Semua"
            isActive={selectedCategoryId === null}
            onPress={() => setSelectedCategoryId(null)}
          />
        }
        renderItem={({ item }) => (
          <CategoryChip
            label={item.name}
            isActive={selectedCategoryId === item.id}
            onPress={() => setSelectedCategoryId(item.id)}
          />
        )}
      />

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
        <FlatList
          data={products}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.productListContent}
          columnWrapperStyle={styles.productRow}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Produk tidak ditemukan.</Text>
            </View>
          }
          renderItem={({ item }) => <ProductCard product={item} onPress={() => addToCart(item)} />}
        />
      )}

      {/* --- Ringkasan keranjang di bagian bawah layar ------------------ */}
      {cartItemCount > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartHeading}>Keranjang</Text>
          <View style={styles.cartList}>
            {cart.map(line => (
              <CartRow
                key={line.product.id}
                line={line}
                onIncrease={() => changeQty(line.product.id, 1)}
                onDecrease={() => changeQty(line.product.id, -1)}
              />
            ))}
          </View>

          <View style={styles.cartFooter}>
            <View>
              <Text style={styles.cartItemCount}>{cartItemCount} item</Text>
              <Text style={styles.cartTotal}>{formatRupiah(cartTotal)}</Text>
            </View>
            <TouchableOpacity style={styles.payButton} onPress={() => setIsCheckoutVisible(true)}>
              <Text style={styles.payButtonText}>Bayar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CheckoutModal
        visible={isCheckoutVisible}
        total={cartTotal}
        isSubmitting={isSubmittingCheckout}
        completedTransaction={completedTransaction}
        onClose={handleCloseCheckout}
        onConfirm={handleConfirmPayment}
      />

      <Toast toast={toast} bottomOffset={cartItemCount > 0 ? 210 : 24} />
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

/** Satu baris item di dalam ringkasan keranjang. */
function CartRow({
  line,
  onIncrease,
  onDecrease,
}: {
  line: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <View style={styles.cartRow}>
      <Text style={styles.cartRowName} numberOfLines={1}>
        {line.product.name}
      </Text>
      <View style={styles.qtyControls}>
        <TouchableOpacity style={styles.qtyButton} onPress={onDecrease}>
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{line.qty}</Text>
        <TouchableOpacity style={styles.qtyButton} onPress={onIncrease}>
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cartRowSubtotal}>{formatRupiah(line.product.price * line.qty)}</Text>
    </View>
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

/**
 * "Debounce" artinya: tunda dulu, jangan langsung reaksi tiap ketukan tombol.
 * Di sini, `debouncedValue` baru ikut berubah `delayMs` mili-detik SETELAH
 * user berhenti mengetik - supaya kita tidak menembak API di setiap huruf
 * yang diketik user di kolom pencarian.
 */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  logoutButton: {
    backgroundColor: colors.rose[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: colors.rose[600],
    fontWeight: '600',
    fontSize: 13,
  },
  searchWrapper: {
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    fontSize: 13,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingLeft: 38,
    paddingRight: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.slate[900],
  },
  categoryList: {
    marginTop: 12,
    flexGrow: 0,
  },
  categoryListContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: colors.white,
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
  categoryChipTextActive: {
    color: colors.white,
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
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
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
  cartBar: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cartHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: 8,
  },
  cartList: {
    maxHeight: 140,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  cartRowName: {
    flex: 1,
    fontSize: 13,
    color: colors.slate[900],
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[700],
  },
  qtyValue: {
    width: 28,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.slate[900],
  },
  cartRowSubtotal: {
    width: 90,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[900],
  },
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  cartItemCount: {
    fontSize: 12,
    color: colors.slate[500],
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand[600],
  },
  payButton: {
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  payButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
