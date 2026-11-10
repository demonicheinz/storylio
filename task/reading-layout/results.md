# Hasil reading layout dan TOC

Perubahan lokal mengikuti arah yang disetujui pengguna, termasuk pengecualian agar penanda item nonaktif tetap ditampilkan.

- Frame Project/Blog: 1160px maksimum, kolom konten 840px, TOC 272px, gutter 48px. Pada viewport 1200px frame menyusut menjadi 1152px. Paragraf maksimum 680px.
- Tablet: frame satu kolom maksimum 840px. Pada 768px frame 720px. Mobile mempertahankan padding 16px per sisi: 358px pada viewport 390px, 288px pada 320px.
- Judul item TOC rata atas dengan line-height 21px, padding vertikal 8px, target minimum 44px, dan gap antaritem 8px.
- Semua item memakai garis horizontal sesuai permintaan terbaru pengguna: aktif 20px, nonaktif 12px, tinggi 1px. Gutter tetap 20px agar teks tidak bergeser saat aktif berubah.
- Judul Project TOC menjadi On this page; deskripsi bantuan dihapus. Judul panjang tidak dipotong.
- Preview dan rute publik memakai komponen/CSS bersama sehingga mendapat perbaikan yang sama. Perubahan SEO dan screenshot dari tugas sebelumnya dipertahankan.

## Verifikasi

- Pemeriksaan browser awal gagal pada kondisi lama (judul/helper TOC berbeda).
- Pemeriksaan akhir tests/browser/reading-layout.js lulus: Project Storylio dan artikel fixture Building Storylio With Server-First Pages pada 1440, 1200, 1024, 768, 390, dan 320px; total 12 kombinasi.
- Memeriksa frame/TOC/paragraf, semua penanda, ukuran target, tanpa overflow horizontal, judul panjang (probe terkontrol) 1–3 baris sesuai lebar, item aktif, disclosure mobile, Escape, dan pengembalian fokus.
- Tidak ada pageerror pada putaran browser akhir. Pengujian awal sempat membaca placeholder streaming dan menyunting teks probe sebelum hydration; pengujian diperbaiki agar membaca konten nyata yang terlihat dan menunggu interaksi client sebelum probe. Tidak ada perubahan aplikasi untuk menutupi kegagalan pengujian tersebut.
- Suite lengkap: 110 file, 834 pengujian lulus. Pemeriksaan tipe dan lint (956 file) lulus. Git diff whitespace bersih. Next.js compilation issues kosong.
- Review independen tidak menemukan regresi produksi; temuan pada asumsi wrap pengujian tablet sudah diperbaiki.
- Panggilan get_errors sebelumnya mengembalikan configErrors/sessionErrors kosong. Pengulangan opsional terakhir tidak dijalankan karena sistem persetujuan otomatis mencapai batas penggunaan; putaran browser terakhir tetap selesai tanpa pageerror.

Tindak lanjut: garis aktif dikembalikan menjadi horizontal. Empat pengujian kontrol TOC dan pemeriksaan browser Project/Blog pada enam ukuran layar lulus setelah pengembalian ini; lint juga lulus. Pratinjau vertikal lama project-toc.png dihapus. Pratinjau penggantinya project-toc-restored.png memakai konten fixture lokal.

Build produksi sebelumnya berhasil pada hook push PR #28. Catatan pengujian lengkap di atas berasal dari implementasi pelebaran layout; perubahan garis ini diverifikasi terpisah tanpa mengubah lebar layout.
