# Revisi prototipe VenomButton

25 Oktober 2026. Scope: memperbaiki referensi sebelum integrasi ke hero.
Source `.docs/referensi/venom-button/VenomButton.tsx` dan CSS module-nya
diperbarui. Tidak ada import baru di `src/`. Perubahan `src/app/globals.css`
yang sudah ada milik pengguna tetap dipertahankan.

## Hasil akhir

- Tidak ada rotate/scale pada tombol saat hover/press; ukuran dan radius
  dapat dikendalikan lewat `--venom-padding` dan `--venom-radius`.
- Pangkal serat mengikuti keliling rounded rectangle ke atas/bawah/kiri/kanan.
  Sembilan serat panjang memiliki pangkal tebal, badan meruncing, persilangan,
  penghubung tipis, dan pantulan tepi. Enam tentakel pendek bergerak bebas
  di sekitar pangkal, tanpa terikat ke kursor.
- Kedua kelompok terus bergerak saat mouse diam. Versi antara sempat tidur
  saat idle; pengguna menolak perilaku itu dan optimisasi tersebut dihapus.
  Efek berhenti saat dilepas karena jarak, klik, keyboard, blur, scroll,
  resize, dokumen tersembunyi, mouse keluar viewport, atau reduced motion.
- Kursor tetap native. Tidak ada SVG tangan atau perubahan cursor global.
  Hanya ujung serat yang melebar di belakang posisi kursor.
- Pantulan luas dan lembut, pantulan kecil yang lebih terang, serta bayangan
  bevel menggantikan garis kilau yang seragam. Kilau permukaan bergeser
  sedikit saat efek aktif. Font tetap Satoshi pada preview.
- Input touch tetap statis dan dapat diklik; `touch-action: manipulation`.
  Focus ring terlihat dan reduced motion yang berubah langsung dihormati.

## Bukti dan pemeriksaan

Preview lokal terisolasi: http://127.0.0.1:3104/ . Source preview ada di
`.tmp/venom-review/`; aplikasi Next.js tidak dibutuhkan untuk menjalankannya.
Build ulang dengan `bun .tmp/venom-review/build.mjs`, jalankan server melalui
`bun .tmp/venom-review/serve.mjs` jika belum berjalan.

Pemeriksaan Chromium melalui Playwright CLI (`storylio-venom`):

- Tarikan empat arah: pangkal berada pada sisi yang benar; transform tombol
  `none`, cursor `pointer`, tidak ada cursor global/ikon tangan pengganti.
- Saat pointer diam, geometri serat panjang dan pendek berubah antar-frame.
  Enam feeler bebas terukur sekitar 29–62 px pada capture pemeriksaan.
- Reduced motion live menyembunyikan overlay dan menghentikan efek aktif.
- Melewati jarak maksimal melepaskan serat; aktivasi keyboard dan touch
  memanggil callback; focus ring dan sentuhan tetap bekerja.
- Mobile 390 px tanpa overflow horizontal; tidak memicu tentakel dengan touch.
- Tidak ada exception runtime. Preview sempat menghasilkan favicon 404
  karena server diagnostik tidak menyediakan favicon; bukan error komponen.
- Typecheck terarah terhadap file referensi dengan
  `bunx --no-install tsc -p .tmp/venom-review/tsconfig.json` lulus.
- Biome kedua file dengan `--vcs-enabled=false` lulus. `bun run typecheck`
  repo juga lulus pada revisi sebelumnya; file akhir diverifikasi lagi dengan
  pemeriksaan TypeScript terarah. Tidak menjalankan build/deploy aplikasi.

`venom-revised-*.png` adalah capture browser akhir, termasuk dark/light,
empat arah, dan mobile. `venom-revised-motion.webm` merekam hover, gerak
ke bawah, atas, kanan, serta pelepasan. Screenshot/video browser tidak
menggambar ulang kursor OS. `venom-browser-check.js` menyimpan pemeriksaan.

Folder `.docs/` diabaikan Git. Salinan dua file akhir di `venom-prototype/`
adalah snapshot yang dapat direview/diikutkan commit bersama task ini;
preview saat ini tetap mengimpor file referensi asli. Backup sebelum perubahan
tersimpan lokal di `.tmp/venom-review/VenomButton.before.*`.

## Batas dan langkah integrasi nanti

Referensi pengguna berupa screenshot, bukan rekaman gerak asli. Bevel dan
timing gerak masih merupakan interpretasi, bukan klaim reproduksi identik.
Prototipe masih button dengan callback; konversi navigasi About ke Link,
pemetaan token tema, serta ukuran/radius final menunggu tahap implementasi.

Self-evaluation (agent-self-evaluation): accuracy 4/5 (perilaku diuji, kemiripan
visual belum disetujui pengguna); completeness 4/5 (seluruh koreksi terbaru
diterapkan, ritme referensi belum memiliki video pembanding); clarity 5/5
(scope dan bukti terpisah dari aplikasi); actionability 5/5 (preview interaktif,
source, rekaman tersedia); conciseness 4/5 (geometri SVG menambah kode).
Rata-rata 4.4/5. Perbaikan paling bernilai berikutnya adalah menyesuaikan timing
dan pantulan berdasarkan rekaman asli bila tersedia. Apakah pengguna setuju?
Belum diketahui; evaluasi kemiripan tetap milik pengguna.
