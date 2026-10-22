# Delay pergantian bahasa About

## Akses dan diagnosis

Preview `storylio-2v2wparmb-heinz.vercel.app/about` dialihkan ke login Vercel.
Tidak ada login atau bypass yang dilakukan. Latensi, region, cache hit dan cold
start deployment tersebut belum dapat diukur langsung.

Kode memperlihatkan bahwa About memilih bahasa dari `searchParams.lang` pada
server. Data profil, konten, struktur dan hasil MDX sudah memiliki scope `use
cache` dengan `cacheLife("hours")`. Namun, link English/Indonesian masih memakai
prefetch default. Full prefetch pada navbar tidak berlaku otomatis pada kontrol
bahasa. Pergantian bahasa mengirim request RSC baru sebelum teks berubah;
request yang nyaris tidak terasa di localhost dapat terlihat di jaringan remote.
Ini adalah penyebab yang direproduksi, bukan pembuktian bahwa cold start atau
region tertentu bermasalah pada preview.

## Bukti lokal produksi

Pengukuran memakai `next start` dan delay tambahan 800 ms untuk request RSC.
Navigasi hanya membuka About dan varian bahasanya, tanpa mutasi data aplikasi.

| Pergantian | Sebelum | Sesudah, probe yang sama |
| --- | --- | --- |
| EN → ID | 1386 ms, 1 request navigasi | 55 ms, 0 request |
| ID → EN | 1350 ms, 1 request navigasi | 39 ms, 0 request |
| EN → ID lagi | 1360 ms, 1 request navigasi | 47 ms, 0 request |

Setelahnya tes regresi yang juga memeriksa URL, indikator bahasa dan scroll
lolos dengan 77/235/124 ms dan nol request navigasi pada setiap pergantian.
Angka ini hasil simulasi lokal, bukan benchmark langsung Vercel. Tidak ada
threshold waktu absolut pada tes; assertion utama adalah konten benar dan
tidak ada request navigasi ketika varian telah diprefetch.

## Perubahan dan batas

- Link bahasa di `language-intro.tsx` memakai `prefetch={true}`.
- `scroll={false}` dipertahankan; bahasa aktif memakai `aria-current="page"`.
- Tidak ada perubahan SQL, cache global, MDX, maupun konten bilingual.
- Loading awal, klik sebelum prefetch siap, invalidasi dan cache expiry masih
  dapat menunggu jaringan. Perbaikan tidak menjanjikan navigasi selalu instan.
- Build produksi 35/35 halaman, termasuk TypeScript, lolos.
- Lint dan diff check lolos.
- `bun run test:browser:about-language` lolos. Petunjuk sesi di README.
- Belum di-commit atau deploy oleh agen; preview belum memuat perbaikan ini.

Tes menunggu respons prefetch sebelum melakukan interaksi. Runtime full prefetch
pada versi Next.js ini dapat tidak menyertakan header `next-router-prefetch`;
deteksi memakai URL/lang/RSC sebelum klik. Tes tidak menunggu penutupan stream
RSC, karena penantian tersebut tidak selesai pada percobaan awal.

Referensi API diperiksa melalui Context7 Next.js dan dokumentasi terpasang
`node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`.
Helper pengukuran sementara berada di `.tmp/about-language-2026-10-22/`.

## Evaluasi mandiri

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Request dan konten diuji sebelum/sesudah; preview terlindungi login. |
| Kelengkapan | 4/5 | EN/ID, URL, indikator aktif dan scroll diuji; belum diverifikasi langsung pada deployment. |
| Kejelasan | 4/5 | Hasil simulasi dibedakan dari fakta deployment; waktu bersifat observasi lokal. |
| Dapat ditindaklanjuti | 4/5 | Patch kecil dan tes reproduktif siap; commit/redeploy dilakukan pengguna. |
| Keringkasan | 4/5 | Tidak merombak page atau sistem i18n; bukti rinci berada di task ini. |

Rata-rata 4,0/5. Berikutnya setelah deploy: ulangi EN/ID dengan jaringan yang sama;
jika masih lambat setelah prefetch selesai, periksa timing RSC serta cache/region
deployment yang dapat diakses. Batas akses dicatat agar kesimpulan dapat dinilai
sesuai bukti yang tersedia.
