# Skeleton berulang pada navigasi public

## Penyebab yang terverifikasi

Build produksi Next.js 16.4.2 mereproduksi masalah: navigasi navbar ke About,
Projects, Blog dan Gallery memunculkan skeleton pada dua putaran berturut-turut.
Setiap perpindahan keempat route itu mengirim request RSC baru. Home langsung
memakai cache tanpa request navigasi.

Keempat page membaca `searchParams` di luar scope `use cache`; hasil build
mengklasifikasikannya sebagai partial prerender. Fungsi data sudah memakai
`cacheLife`, tetapi cache data server tidak berarti seluruh hasil page sudah
tersedia pada client. Navbar sebelumnya memakai `Link` dengan prefetch default;
dalam konfigurasi `partialPrefetching: false`, prefetch route dinamis berhenti
pada batas loading. Dynamic page cache default adalah nol detik. Home tidak
membaca `searchParams` dan hasil build mengklasifikasikannya sebagai static.

`unstable_instant` pada page bukan pengganti prop prefetch pada link. Tidak ada
perubahan SQL/query Drizzle yang diperlukan untuk memperbaiki gejala ini.
Pemeriksaan ini membuktikan perilaku konfigurasi saat ini; tidak melakukan
bisect untuk menentukan commit pertama yang memperkenalkannya.

## Perbaikan

Tambahkan `prefetch={true}` pada link `src/components/common/floating-nav.tsx`.
Navbar hanya digunakan oleh public chrome. Link sekarang melakukan full
prefetch untuk kelima tujuan sehingga page bisa dipakai ulang pada client.
Cache dashboard dan flag global tidak diubah. Skeleton tetap tersedia untuk
kunjungan yang belum selesai dimuat, cache kedaluwarsa, atau invalidasi.

## Verifikasi

- Build produksi lolos: 35/35 halaman, termasuk TypeScript.
- Playwright CLI menguji Home → About → Projects → Blog → Gallery → Home dua kali.
- Request RSC diberi delay 250 ms agar cache miss terlihat.
- Sebelum perbaikan: keempat route selain Home menampilkan skeleton dan meminta
  RSC pada kedua putaran.
- Sesudah perbaikan, tes dari fresh document: kunjungan About pertama masih
  dapat menampilkan skeleton sebelum prefetch selesai; putaran kedua kelima
  route memiliki nol skeleton dan nol blocking navigation request.
- Regresi tersimpan di `tests/browser/public-navigation.js`; jalankan
  `bun run test:browser:navigation` terhadap server produksi lokal. README
  menjelaskan pembukaan dan penutupan sesi terisolasi.
- Lint dan `git diff --check` lolos.
- Setelah pemulihan checksum baseline, seluruh 49 tes Vitest pada 9 file lolos.

Prefetch otomatis tidak berjalan pada `next dev`; verifikasi harus memakai
`next build` dan `next start`. Tidak ada deployment atau mutasi database yang
dijalankan. Hanya route listing public yang dinavigasi, tanpa membuka detail
yang mencatat view.

## Temuan terpisah: checksum baseline

Suite Vitest penuh awalnya gagal 7 tes baseline. SQL yang tersimpan setelah
commit memiliki satu LF tambahan di akhir. Hash saat ditemukan:
`91f9af04887fad322188ab3398eda174df32a9c2fa14ef4f96a2a8ca13d98e94`.
Menghapus tepat LF akhir mengembalikan hash ke nilai fingerprint yang telah
diadopsi: `8affe92180c039c515f7770dcadab62026e7fd4a450b80b7bb7f4662d1dbc1e0`.
Pemulihan dijaga dengan perbandingan hash sebelum file ditulis. Ledger dan
fingerprint tidak diubah. `.editorconfig` kini mengecualikan `drizzle/*.sql`
dari penambahan final newline dan trimming otomatis. Tool yang menambahkan LF
tersebut belum teridentifikasi; aturan editor adalah pencegahan, bukan bukti
penyebab perubahan byte sebelumnya.

## Referensi lokal

- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/staleTimes.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md`

Dokumentasi Context7 Next.js juga digunakan untuk mengonfirmasi perbedaan
prefetch default dan full prefetch.

## Evaluasi mandiri

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Request RSC dan skeleton direproduksi sebelum/sesudah; commit awal penyebab tidak dibisect. |
| Kelengkapan | 4/5 | Lima tujuan navbar diuji ulang; navigasi varian filter dan detail bukan cakupan tes ini. |
| Kejelasan | 4/5 | Cache data server dan page client dibedakan; detail checksum dipisahkan. |
| Dapat ditindaklanjuti | 4/5 | Fix satu baris dan tes CLI tersedia; perlu commit/deploy pengguna agar berlaku di hosted app. |
| Keringkasan | 4/5 | Bukti dipusatkan di task; penjelasan pengguna cukup merujuk penyebab dan hasil. |

Rata-rata 4,0/5. Prioritas berikutnya jika gejala muncul lagi: identifikasi route
filter/detail dan apakah pengujian berjalan di dev atau produksi. Pengguna dapat
mengulang pengukuran dengan command browser yang disediakan.
