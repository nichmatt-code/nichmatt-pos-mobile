import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import { createCustomer, CustomerPayload, updateCustomer } from '../api/customers';
import { ApiError } from '../api/client';
import { Customer } from '../types';

interface Props {
  visible: boolean;
  /** `null` berarti mode tambah baru; kalau ada isinya, mode edit pelanggan ini. */
  customer: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

/** Pesan error yang siap ditampilkan - gabungan semua pesan validasi per-field
 * kalau ada (lebih jelas daripada pesan umum "The given data was invalid."). */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessages = error.fieldErrors ? Object.values(error.fieldErrors).flat() : [];
    return fieldMessages.length > 0 ? fieldMessages.join('\n') : error.message;
  }
  return 'Coba lagi sebentar.';
}

/**
 * Form tambah/edit pelanggan - satu komponen untuk dua mode, sama seperti
 * modal `showFormModal` di Livewire\Customers\Index (bukan halaman
 * terpisah). Validasi field (wajib, panjang, format tanggal) dijalankan di
 * server; di sini cuma menampilkan pesannya kalau gagal.
 */
export default function CustomerFormModal({ visible, customer, onClose, onSaved }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = customer !== null;

  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [birthdate, setBirthdate] = useState(customer?.birthdate ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const payload: CustomerPayload = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      birthdate: birthdate.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setIsSaving(true);

    try {
      const saved = isEditing
        ? await updateCustomer(customer.id, payload)
        : await createCustomer(payload);

      onSaved(saved);
      onClose();
    } catch (error) {
      Alert.alert(isEditing ? 'Gagal menyimpan perubahan' : 'Gagal menambah pelanggan', errorMessage(error));
    } finally {
      setIsSaving(false);
    }
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
          <Text style={styles.title}>{isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.label}>Nama</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="mis. Budi Santoso"
            placeholderTextColor={colors.slate[400]}
          />

          <Text style={styles.label}>Nomor Telepon</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="mis. 081234567890"
            placeholderTextColor={colors.slate[400]}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Alamat (opsional)</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="mis. Jl. Mawar No. 1"
            placeholderTextColor={colors.slate[400]}
          />

          <Text style={styles.label}>Tanggal Lahir (opsional)</Text>
          <TextInput
            style={styles.input}
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="YYYY-MM-DD, mis. 1998-05-20"
            placeholderTextColor={colors.slate[400]}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="mis. Suka kopi tanpa gula"
            placeholderTextColor={colors.slate[400]}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitButton, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.slate[50],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
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
    form: {
      padding: 16,
      paddingBottom: 32,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.slate[600],
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.slate[200],
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.slate[900],
    },
    notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: colors.brand[600],
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: colors.white,
      fontWeight: '700',
    },
  });
}
