import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import { colors } from '../theme/colors';
import { User } from '../types';

interface Props {
  // Fungsi ini dipanggil oleh LoginScreen setelah login SUKSES, supaya
  // komponen di atasnya (App.tsx) tahu "user sudah login" dan bisa
  // menampilkan layar Kasir. Layar ini sendiri tidak tahu (dan tidak perlu
  // tahu) apa yang terjadi setelah dipanggil.
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  // useState menyimpan "state": data yang bisa berubah dan, kalau berubah,
  // otomatis membuat React menggambar ulang (re-render) tampilan ini.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dipakai supaya border input berubah warna jadi brand-500 saat sedang
  // diketik, meniru efek `focus:border-brand-500` di versi web.
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setErrorMessage('Email dan password wajib diisi.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email: email.trim(), password });
      onLoginSuccess(user);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Dua lingkaran samar ini cuma dekorasi latar belakang, meniru
          "blob" biru transparan di belakang kartu login versi web. */}
      <View style={styles.decorTop} pointerEvents="none" />
      <View style={styles.decorBottom} pointerEvents="none" />

      {/* KeyboardAvoidingView mendorong konten ke atas saat keyboard muncul,
          supaya input password tidak ketutupan keyboard di HP. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />

          <View style={styles.card}>
            <Text style={styles.title}>Masuk ke akun Anda</Text>
            <Text style={styles.subtitle}>Kelola penjualan toko Anda dari satu tempat.</Text>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="nama@toko.com"
              placeholderTextColor={colors.slate[400]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              placeholderTextColor={colors.slate[400]}
              secureTextEntry
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Masuk</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>© {new Date().getFullYear()} NichmattPOS. Semua hak dilindungi.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  flex: {
    flex: 1,
  },
  decorTop: {
    position: 'absolute',
    top: -140,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 300,
    borderRadius: 200,
    backgroundColor: colors.brand[100],
    opacity: 0.5,
  },
  decorBottom: {
    position: 'absolute',
    bottom: -100,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.brand[50],
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 160,
    height: 88,
    alignSelf: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 32,
    // "shadow-soft" di web (0 12px 32px -12px rgb(15 23 42 / 0.18)),
    // di RN diterjemahkan lewat shadow* (iOS) dan elevation (Android).
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate[900],
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[600],
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(248, 250, 252, 0.6)',
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: colors.slate[900],
  },
  inputFocused: {
    borderColor: colors.brand[500],
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: colors.rose[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.rose[600],
    fontSize: 13,
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: colors.slate[400],
  },
});
