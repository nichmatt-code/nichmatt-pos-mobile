import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { formatRupiah } from '../utils/currency';
import { CartItem, CouponCheckResult, SelfOrderClaim } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  allowPriceEdit: boolean;
  onIncrease: (productId: number) => void;
  onDecrease: (productId: number) => void;
  onPriceChange: (productId: number, text: string) => void;
  onNoteChange: (productId: number, text: string) => void;
  claimedSelfOrder: SelfOrderClaim | null;
  onRemoveSelfOrder: () => void;
  appliedCoupon: CouponCheckResult | null;
  couponCodeInput: string;
  onCouponCodeInputChange: (text: string) => void;
  isCheckingCoupon: boolean;
  couponError: string | null;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onShowBillPreview: () => void;
  cartItemCount: number;
  estimatedTotal: number;
  isPreparingCheckout: boolean;
  onOpenCheckout: () => void;
}

/**
 * Layar keranjang penuh, dipisah dari KasirScreen supaya isinya punya
 * ruang gulir (scroll) yang sebenarnya - sebelumnya keranjang cuma
 * ditempel di kotak kecil di bawah layar produk, jadi kalau isinya
 * banyak, semua baris (harga, catatan, kupon, tombol bayar) numpuk dan
 * kelihatan berantakan. Di sini semuanya dapat satu layar penuh sendiri.
 */
export default function CartModal({
  visible,
  onClose,
  cart,
  allowPriceEdit,
  onIncrease,
  onDecrease,
  onPriceChange,
  onNoteChange,
  claimedSelfOrder,
  onRemoveSelfOrder,
  appliedCoupon,
  couponCodeInput,
  onCouponCodeInputChange,
  isCheckingCoupon,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
  onShowBillPreview,
  cartItemCount,
  estimatedTotal,
  isPreparingCheckout,
  onOpenCheckout,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Keranjang ({cartItemCount} item)</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        {!!claimedSelfOrder && (
          <View style={styles.selfOrderAppliedRow}>
            <Text style={styles.selfOrderAppliedText}>
              Dari Self Order: {claimedSelfOrder.code}
              {claimedSelfOrder.customer_name ? ` · ${claimedSelfOrder.customer_name}` : ''}
            </Text>
            <TouchableOpacity onPress={onRemoveSelfOrder}>
              <Text style={styles.removeText}>Lepas</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>Keranjang kosong.</Text>
          ) : (
            cart.map(line => (
              <CartRow
                key={line.product.id}
                line={line}
                allowPriceEdit={allowPriceEdit}
                onIncrease={() => onIncrease(line.product.id)}
                onDecrease={() => onDecrease(line.product.id)}
                onPriceChange={text => onPriceChange(line.product.id, text)}
                onNoteChange={text => onNoteChange(line.product.id, text)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          {appliedCoupon ? (
            <View style={styles.couponAppliedRow}>
              <Text style={styles.couponAppliedText}>
                Kupon {appliedCoupon.code}: -{formatRupiah(appliedCoupon.discount_amount)}
              </Text>
              <TouchableOpacity onPress={onRemoveCoupon}>
                <Text style={styles.removeText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inlineInputRow}>
              <TextInput
                style={styles.inlineInput}
                value={couponCodeInput}
                onChangeText={onCouponCodeInputChange}
                placeholder="Kode kupon (opsional)"
                placeholderTextColor={colors.slate[400]}
                autoCapitalize="characters"
                editable={!isCheckingCoupon}
              />
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={onApplyCoupon}
                disabled={isCheckingCoupon}>
                {isCheckingCoupon ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.inlineButtonText}>Terapkan</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {!!couponError && <Text style={styles.errorText}>{couponError}</Text>}

          <TouchableOpacity style={styles.billButton} onPress={onShowBillPreview}>
            <Text style={styles.billButtonText}>Cetak Bill</Text>
          </TouchableOpacity>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupiah(estimatedTotal)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.payButton, isPreparingCheckout && styles.buttonDisabled]}
            onPress={onOpenCheckout}
            disabled={isPreparingCheckout || cart.length === 0}>
            {isPreparingCheckout ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.payButtonText}>Bayar</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/** Satu baris item di dalam keranjang. */
function CartRow({
  line,
  allowPriceEdit,
  onIncrease,
  onDecrease,
  onPriceChange,
  onNoteChange,
}: {
  line: CartItem;
  allowPriceEdit: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onPriceChange: (text: string) => void;
  onNoteChange: (text: string) => void;
}) {
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartRowTop}>
        <View style={styles.cartRowNameColumn}>
          <Text style={styles.cartRowName} numberOfLines={1}>
            {line.product.name}
          </Text>
          {allowPriceEdit ? (
            <View style={styles.priceEditRow}>
              <Text style={styles.priceEditPrefix}>Rp</Text>
              <TextInput
                style={styles.priceEditInput}
                value={String(line.price)}
                onChangeText={onPriceChange}
                keyboardType="number-pad"
              />
            </View>
          ) : (
            <Text style={styles.cartRowPrice}>{formatRupiah(line.price)}</Text>
          )}
        </View>
        <View style={styles.qtyControls}>
          <TouchableOpacity style={styles.qtyButton} onPress={onDecrease}>
            <Text style={styles.qtyButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{line.qty}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={onIncrease}>
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cartRowSubtotal}>{formatRupiah(line.price * line.qty)}</Text>
      </View>

      <TextInput
        style={styles.noteEditInput}
        value={line.note}
        onChangeText={onNoteChange}
        placeholder="Tambah catatan..."
        placeholderTextColor={colors.slate[400]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  closeText: {
    color: colors.slate[500],
    fontWeight: '600',
  },
  selfOrderAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.brand[50],
    marginHorizontal: 16,
    marginTop: 12,
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
  removeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.rose[600],
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyText: {
    color: colors.slate[400],
    textAlign: 'center',
    marginTop: 40,
  },
  cartRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  cartRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartRowNameColumn: {
    flex: 1,
  },
  cartRowName: {
    fontSize: 14,
    color: colors.slate[900],
  },
  cartRowPrice: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 1,
  },
  priceEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priceEditPrefix: {
    fontSize: 12,
    color: colors.slate[500],
    marginRight: 3,
  },
  priceEditInput: {
    fontSize: 12,
    color: colors.slate[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[300],
    paddingVertical: 0,
    minWidth: 50,
  },
  noteEditInput: {
    fontSize: 12,
    color: colors.slate[600],
    fontStyle: 'italic',
    marginTop: 4,
    padding: 0,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
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
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
  errorText: {
    color: colors.rose[600],
    fontSize: 11,
    marginTop: 4,
  },
  couponAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.emerald[50],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  couponAppliedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.emerald[600],
  },
  billButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  billButtonText: {
    color: colors.slate[700],
    fontWeight: '600',
    fontSize: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.slate[500],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand[600],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  payButton: {
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  payButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
