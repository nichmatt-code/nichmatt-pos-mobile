/**
 * Titik masuk (entry point) tampilan aplikasi.
 *
 * App.tsx ini sengaja dibuat SEDERHANA: cuma menyimpan satu potong state
 * ("siapa user yang sedang login, kalau ada") lalu memilih mau menampilkan
 * LoginScreen atau KasirScreen berdasarkan itu. Tidak pakai library
 * navigasi (react-navigation dkk) supaya tidak perlu install modul native
 * tambahan dulu - untuk 2 layar seperti ini, if/else biasa sudah cukup.
 */
import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import KasirScreen from './src/screens/KasirScreen';
import SplashOverlay from './src/components/SplashOverlay';
import { User } from './src/types';

// Berapa lama logo splash ditampilkan sebelum pindah ke layar Login -
// cukup singkat supaya tidak terasa lambat, tapi tetap cukup buat logo
// kelihatan jelas (bukan cuma kedip sekilas).
const SPLASH_DURATION_MS = 900;

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Selama `user` masih `null`, artinya belum ada yang login.
  const [user, setUser] = useState<User | null>(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsSplashVisible(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {isSplashVisible ? (
        <SplashOverlay />
      ) : user ? (
        <KasirScreen user={user} onLogout={() => setUser(null)} />
      ) : (
        <LoginScreen onLoginSuccess={setUser} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
