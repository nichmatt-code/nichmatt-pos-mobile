import * as Print from 'expo-print';

/**
 * Cetak baris-baris struk/bill lewat dialog print bawaan OS (AirPrint di
 * iOS, layanan print Android). Ini BUKAN cetak langsung ke printer
 * thermal lewat Bluetooth (itu butuh modul native yang tidak didukung
 * Expo Go) - tapi banyak printer thermal juga menyediakan driver resmi
 * yang muncul di dialog print bawaan ini, jadi tetap bisa kepakai kalau
 * printernya sudah terpasang di HP.
 *
 * Baris-baris teksnya dibungkus tag <pre> supaya spasi rata seperti
 * struk kasir beneran (font monospace), bukan rata kiri-kanan biasa.
 */
export async function printReceiptLines(lines: string[]): Promise<void> {
  const escaped = lines
    .map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('\n');

  const html = `
    <html>
      <body style="margin: 0; padding: 16px;">
        <pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${escaped}</pre>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
}
