import React, { useMemo } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenStockOpname: () => void;
  canAccessStockOpname: boolean;
  onLogout: () => void;
}

/**
 * Drawer menu penuh, meniru gaya menu mobile di versi web: kartu
 * "Subscription" bergradasi di atas, lalu daftar menu dikelompokkan per
 * section dengan judul huruf besar (mis. "KASIR"), dan item yang sedang
 * aktif diberi latar biru muda.
 *
 * CATATAN: versi web adalah panel admin LENGKAP (Dashboard, Produk,
 * Kategori, Inventory, Satuan, Tags, Paket, Kupon, Pelanggan, dst) -
 * modul-modul itu belum dibangun di mobile (mobile baru mencakup Kasir +
 * Riwayat Transaksi + Stock Opname). Yang disamakan dulu cuma GAYA
 * tampilannya; kalau modul lain dibuatkan di mobile nanti, tinggal
 * ditambah sebagai section baru di sini.
 */
export default function MoreMenuModal({
  visible,
  onClose,
  onOpenHistory,
  onOpenStockOpname,
  canAccessStockOpname,
  onLogout,
}: Props) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function go(action: () => void) {
    onClose();
    // Jeda sedikit supaya drawer ini sempat tertutup dulu sebelum modal
    // berikutnya (mis. Riwayat Transaksi) terbuka - dua Modal RN yang
    // berganti persis bersamaan kadang tampil aneh sesaat di Android.
    setTimeout(action, 200);
  }

  function handleSubscriptionPress() {
    Alert.alert(
      'Segera Hadir',
      'Kelola langganan toko lewat NichmattPOS di komputer untuk saat ini.',
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={toggleTheme}
              accessibilityLabel="Ganti tema gelap/terang">
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={colors.slate[500]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onClose}
              accessibilityLabel="Tutup menu">
              <Ionicons name="close" size={22} color={colors.slate[500]} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleSubscriptionPress}>
            <LinearGradient
              colors={[colors.brand[500], colors.brand[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscriptionBanner}>
              <Ionicons name="star" size={16} color={colors.white} />
              <Text style={styles.subscriptionBannerText}>Subscription</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Kasir</Text>
          <View style={styles.group}>
            <View style={[styles.item, styles.itemActive]}>
              <Text style={[styles.itemText, styles.itemTextActive]}>Kasir</Text>
            </View>
            <TouchableOpacity style={styles.item} onPress={() => go(onOpenHistory)}>
              <Text style={styles.itemText}>Riwayat Transaksi</Text>
            </TouchableOpacity>
            {canAccessStockOpname && (
              <TouchableOpacity style={styles.item} onPress={() => go(onOpenStockOpname)}>
                <Text style={styles.itemText}>Stock Opname</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutRow} onPress={() => go(onLogout)}>
            <Text style={styles.logoutText}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.slate[200],
    },
    logo: {
      width: 100,
      height: 30,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIconButton: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
    },
    subscriptionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 20,
    },
    subscriptionBannerText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 14,
      marginLeft: 8,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.slate[400],
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    group: {
      marginBottom: 8,
    },
    item: {
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 2,
    },
    itemActive: {
      backgroundColor: colors.brand[50],
    },
    itemText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.slate[700],
    },
    itemTextActive: {
      color: colors.brand[700],
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.slate[200],
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    logoutRow: {
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    logoutText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.rose[600],
    },
  });
}
