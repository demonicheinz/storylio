# Polesan skeleton public

Skeleton memakai ukuran container dan jarak header halaman Storylio, dengan
placeholder untuk judul dua baris, statistik, filter, serta gambar dan teks
konten unggulan. About memiliki kerangka profil/bio; Gallery memakai susunan
gambar dengan rasio bervariasi. Semua menggunakan token surface, border dan
brand yang sudah ada, tanpa dependency atau aset tambahan.

`src/app/(public)/loading.tsx` tetap menjadi satu entry loading route public.
Pemilihan visual memakai pathname; Suspense internal menyediakan skeleton umum
saat pathname belum tersedia. Tidak ada loading boundary route tambahan yang
dipertahankan. Placeholder visual disembunyikan dari screen reader, dengan
status loading dan aria-busy pada container. Pulse hanya aktif bila pengguna
tidak meminta reduced motion.

Verifikasi visual dilakukan pada ketiga variasi di 1440px dan 390px, tanpa
overflow horizontal. Reduced motion menghasilkan animation-name none. Screenshot
dan helper lokal berada di `.tmp/public-skeleton-2026-10-22/`. Preview route
sementara sudah dihapus dan tidak termasuk build akhir. Pemeriksaan desain
mekanis tidak menemukan temuan. Lint, diff check, dan build produksi 35/35
halaman termasuk TypeScript lolos.

Percobaan awal memakai loading file terpisah untuk About/Gallery. Tes navigasi
menangkap request ulang About pada putaran kedua, sehingga pendekatan tersebut
diganti dengan entry loading public yang sudah ada; komposisi visual tetap sama.
Tes regresi navigasi pada build akhir lolos: kelima tujuan pada putaran kedua
memiliki nol skeleton dan nol blocking navigation request.

Dokumentasi konteks desain formal bisa ditambahkan nanti melalui `/impeccable init`;
polish ini mengikuti komponen serta token Storylio yang sudah ada.

## Evaluasi mandiri

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Komposisi mengikuti hero, profil, filter dan gallery aktual; jumlah item tetap placeholder. |
| Kelengkapan | 4/5 | Tiga variasi, desktop/mobile, reduced motion dan build diverifikasi; detail artikel memakai fallback koleksi umum. |
| Kejelasan | 4/5 | Satu komponen visual dan entry loading; pemilihan pathname menambah sedikit client code. |
| Dapat ditindaklanjuti | 4/5 | Siap ditinjau melalui diff dan screenshot lokal; belum di-commit/deploy. |
| Keringkasan | 4/5 | Bagian header/filter/teks dipakai ulang; bentuk profil dan gallery tetap perlu markup sendiri. |

Rata-rata 4,0/5. Penyempurnaan berikutnya hanya bila diminta: skeleton khusus
halaman detail. Ruang lingkup saat ini memenuhi polesan halaman public yang
sedang dibahas, sambil menjaga gaya visual yang sudah ada.
