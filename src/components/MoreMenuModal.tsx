import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

interface MenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
}

/** Popup menu kecil dari navbar - daftar aksi yang tidak muat semua jadi tombol sendiri-sendiri. */
export default function MoreMenuModal({ visible, onClose, items }: Props) {
  function handlePress(item: MenuItem) {
    onClose();
    // Jeda sedikit supaya modal ini sempat tertutup dulu sebelum modal
    // berikutnya (mis. Riwayat Transaksi) terbuka - dua Modal RN yang
    // berganti persis bersamaan kadang tampil aneh sesaat di Android.
    setTimeout(item.onPress, 200);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.item, index === items.length - 1 && styles.itemLast]}
              onPress={() => handlePress(item)}>
              <Text style={[styles.itemText, item.destructive && styles.itemTextDestructive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[700],
  },
  itemTextDestructive: {
    color: colors.rose[600],
  },
});
