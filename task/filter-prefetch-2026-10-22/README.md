# Prefetch berdasarkan interaksi filter public

Filter stack Projects dan topik Blog memakai komponen `FilterLink` bersama.
Tampilan tetap memakai Button yang sama, dengan anchor Next.js sebagai elemen
navigasi. `prefetch` awal bernilai false; hover atau fokus keyboard mengaktifkan
full prefetch hanya untuk pilihan yang disentuh. All memakai perilaku yang sama
saat tidak aktif. Filter aktif tidak diprefetch dan navigasi berulang ke pilihan
aktif dicegah. Klik biasa, Enter dan pembukaan link di tab baru memakai semantik
link native. Label memberi feedback pending melalui `useLinkStatus`.

Builder URL pada masing-masing domain mempertahankan query lain menggunakan
URLSearchParams, dan scroll tetap false. Data/query Drizzle tidak diubah.

## Verifikasi

- Sebelum implementasi, tes browser gagal karena hover tidak menghasilkan
  request prefetch dalam 5 detik.
- Build produksi setelah implementasi lolos 35/35 halaman, termasuk TypeScript.
- Lint 261 file serta diff check lolos.
- Tes browser memakai tambahan delay RSC 500 ms dan data public dev.
- Tidak ada varian filter yang diprefetch saat page load.
- Projects: hover Framer Motion, fokus keyboard Next.js, dan reset All lolos.
- Blog: hover Architecture, fokus keyboard Dashboard, dan reset All lolos.
- Hover/fokus tidak menavigasi. Klik/Enter setelah prefetch memakai hasil cache
  tanpa request navigasi tambahan ke varian tersebut.
- Parameter `keep=filter-test` tetap ada setelah pemilihan dan reset; scroll
  setelah pemilihan hover tidak berubah.

Tes awal setelah implementasi sempat menunggu response baru saat fokus All.
Karena All sudah ada di cache dari document awal, tidak adanya request adalah
hasil yang benar. Tes fokus diperbaiki agar memakai varian kedua yang belum
dimuat. Setelah review CodeRabbit, assertion nol request pada reset All dihapus:
cache All dapat kedaluwarsa/terbuang dan fokus boleh memulai prefetch baru yang
tercatat setelah pengukuran dimulai. Reset memeriksa bahwa fokus tidak menavigasi,
Enter menghapus filter, parameter lain tetap ada, dan All menjadi aktif, tanpa
membatasi jumlah request. Assertion reuse setelah prefetch hover/fokus pilihan
lain tetap dipertahankan.

Saat pengujian ulang, assertion selesai tetapi cleanup menemukan race
`Route is already handled` pada handler delay yang masih berjalan. Cleanup
sekarang memakai `page.unrouteAll({ behavior: "wait" })` pada sesi tes terisolasi
yang memiliki handler tersebut agar handler aktif selesai terlebih dahulu.

Jalankan `bun run test:browser:filters` pada sesi `storylio-filters` yang membuka
build produksi. Fixture public perlu memiliki setidaknya dua stack dan dua
topik. Instruksi sesi tersedia di README. Tes tidak mengubah data aplikasi.
Perubahan belum di-commit atau deploy oleh agen.

## Evaluasi mandiri

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Request prefetch dan reuse diuji pada dua domain; hasil berlaku ketika prefetch sudah siap. |
| Kelengkapan | 4/5 | Hover, fokus, Enter, All, query lain dan scroll tercakup; perangkat touch belum diuji terpisah. |
| Kejelasan | 4/5 | Perilaku intent berada pada satu FilterLink; builder URL tetap dekat domainnya. |
| Dapat ditindaklanjuti | 4/5 | Patch dan command tes siap; hosted rollout masih membutuhkan commit/deploy pengguna. |
| Keringkasan | 4/5 | Dua implementasi event/transisi diganti komponen bersama; tes browser memuat skenario lengkap. |

Rata-rata 4,0/5. Perbaikan berikutnya bila dibutuhkan: uji perangkat touch dan
cache expiry pada deployment yang dapat diakses. Tidak ada janji bahwa klik
sebelum prefetch selesai atau setelah invalidasi akan selalu instan.
