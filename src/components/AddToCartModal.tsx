import React, { useMemo, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatRupiah } from '../utils/currency';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import { Product } from '../types';

interface Props {
  /** `null` berarti modal tertutup - tidak ada produk yang sedang dipilih. */
  product: Product | null;
  /** Sisa stok yang masih boleh ditambahkan (stok asli dikurangi yang sudah ada di keranjang). */
  maxQty: number;
  onClose: () => void;
  onConfirm: (qty: number, note: string) => void;
}

/**
 * Popup konfirmasi jumlah + catatan sebelum produk benar-benar masuk
 * keranjang - meniru modal detail produk di kasir versi web (qty
 * stepper + catatan opsional + tombol "Tambahkan").
 */
export default function AddToCartModal({ product, maxQty, onClose, onConfirm }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  if (!product) {
    return null;
  }

  function handleConfirm() {
    onConfirm(qty, note.trim());
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.imageWatermark}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.body}>
            <Text style={styles.name}>{product.name}</Text>
            {!!product.description && (
              <Text style={styles.description}>{product.description}</Text>
            )}
            <Text style={styles.price}>{formatRupiah(product.price)}</Text>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQty(current => Math.max(1, current - 1))}>
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQty(current => Math.min(maxQty, current + 1))}>
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Catatan (opsional)</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="mis. tanpa gula, pedas level 2"
              placeholderTextColor={colors.slate[400]}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Tambahkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: colors.slate[100],
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWatermark: {
    width: '40%',
    height: '40%',
    opacity: 0.3,
    tintColor: colors.slate[400],
  },
  body: {
    padding: 20,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  description: {
    fontSize: 13,
    color: colors.slate[500],
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand[600],
    marginTop: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate[700],
  },
  qtyValue: {
    width: 48,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate[900],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[600],
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.slate[900],
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.slate[100],
    marginRight: 8,
  },
  cancelButtonText: {
    color: colors.slate[700],
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: colors.brand[600],
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  });
}
