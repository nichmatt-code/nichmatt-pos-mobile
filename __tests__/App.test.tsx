/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  jest.useFakeTimers();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  // App menampilkan logo splash lewat setTimeout - majukan waktu di sini
  // (di dalam act) supaya timer itu selesai sebelum test unmount, jangan
  // sampai menyala setelah renderer sudah dibongkar.
  await ReactTestRenderer.act(() => {
    jest.runAllTimers();
  });

  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
  jest.useRealTimers();
});
