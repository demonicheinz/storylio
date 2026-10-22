# Skeleton detail Project dan Blog

Entry loading public sebelumnya hanya membedakan About, Gallery, dan koleksi.
Akibatnya, `/projects/[slug]` serta `/blog/[slug]` ikut memakai skeleton daftar.

Pemilihan pathname sekarang mengenali `project-detail` dan `post-detail`.
Project memakai cover 16:9 serta panel tag, judul, deskripsi, metadata dan CTA;
Blog memakai toolbar kembali/share, judul, metadata/tag, cover lebar dan isi
artikel. Keduanya memiliki kerangka teks dan daftar isi pada desktop. Lebar
container, breakpoint, surface, border, placeholder serta reduced motion
mengikuti komponen public yang sudah ada. Tidak ada loading boundary route baru.

## Verifikasi

- Dua tes detail gagal sebelum perubahan dan lolos sesudahnya. Enam kasus pada
  `tests/public/loading.test.ts` memeriksa detail Project/Blog serta tetapnya
  layout Projects, Blog, About dan Gallery.
- Build produksi 35/35 halaman, termasuk TypeScript, lolos.
- Lint 262 file dan diff check lolos.
- Suite penuh Vitest lolos: 55 tes pada 10 file. Pemeriksaan desain mekanis
  tidak melaporkan temuan.
- Navigasi produksi diperiksa pada lebar 1440px dan 390px dengan delay RSC
  1800 ms. Observer hanya mencatat project-detail atau post-detail yang sesuai;
  tidak ada skeleton collection selama transisi yang diuji.
- Screenshot empat kombinasi disimpan di `.tmp/detail-skeleton-2026-10-22/`.
  Tidak ada overflow horizontal. Screenshot telah diperiksa secara visual.
- `/api/views/*` dimock di browser selama pemeriksaan; tidak menulis view ke
  database. Helper dan gambar sementara diabaikan Git.
- Tidak ada commit atau deployment oleh agen.

## Evaluasi mandiri

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Layout mengikuti struktur detail aktual; skeleton tetap perkiraan panjang konten. |
| Kelengkapan | 4/5 | Kedua detail dan enam mapping route diuji; route preview privat bukan cakupan perubahan. |
| Kejelasan | 4/5 | Variasi bernama eksplisit, placeholder/body dipakai ulang; pemilihan route masih berada di entry loading. |
| Dapat ditindaklanjuti | 4/5 | Tes, build dan screenshot lokal tersedia; pengguna masih perlu commit/deploy. |
| Keringkasan | 4/5 | Komponen bersama bertambah untuk mencerminkan dua layout berbeda; tidak menambah konfigurasi route. |

Rata-rata 4,0/5. Penyempurnaan berikutnya bila dibutuhkan adalah cakupan loading
preview; hasil saat ini memenuhi laporan pengguna pada detail public.
