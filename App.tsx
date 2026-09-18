/**
 * Titik masuk (entry point) tampilan aplikasi.
 *
 * App.tsx ini sengaja dibuat SEDERHANA: cuma menyimpan satu potong state
 * ("siapa user yang sedang login, kalau ada") lalu memilih mau menampilkan
 * LoginScreen atau KasirScreen berdasarkan itu. Tidak pakai library
 * navigasi (react-navigation dkk) supaya tidak perlu install modul native
 * tambahan dulu - untuk 2 layar seperti ini, if/else biasa sudah cukup.
 */
import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import KasirScreen from './src/screens/KasirScreen';
import { User } from './src/types';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Selama `user` masih `null`, artinya belum ada yang login.
  const [user, setUser] = useState<User | null>(null);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {user ? (
        <KasirScreen user={user} onLogout={() => setUser(null)} />
      ) : (
        <LoginScreen onLoginSuccess={setUser} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
