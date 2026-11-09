# Hasil perbaikan metadata screenshot

Isian dashboard bukan hilang. Alur penyimpanan tetap menyimpan caption dan altText, query halaman publik mengambil keduanya, dan ProjectScreenshots menerima nilainya. Bug ada pada renderer gambar di DepthCarousel yang memakai `alt=""` dan tidak menampilkan caption di luar lightbox.

## Perubahan

- Gambar menggunakan altText tersimpan. Nilai kosong/whitespace memakai caption, kemudian nama proyek dan nomor screenshot sebagai fallback.
- Caption aktif diteruskan dari CMS dan tampil di bawah carousel. Caption juga dihubungkan ke gambar aktif melalui aria-describedby.
- Hanya gambar aktif diekspos ke teknologi bantu. Lapisan belakang tetap dekoratif bagi pembaca layar.
- Semua elemen img tersedia sejak HTML awal. Slide di luar tiga lapisan visual diberi hidden dan CSS display:none; native lazy loading tetap digunakan.
- Tidak mengubah database, isi dashboard, urutan screenshot, cover, atau Gallery. Perubahan About dari tugas sebelumnya dipertahankan.

## Verifikasi yang sudah selesai

- Empat uji regresi gagal sebelum perbaikan karena alt kosong serta gambar di luar tiga lapisan belum dirender.
- Enam uji screenshot lulus setelah perbaikan, termasuk alt dari CMS, caption terlihat, fallback, urutan, satu gambar, tidak ada gambar, dan 20 gambar di HTML awal dengan 17 lapisan hidden.
- Suite lengkap `bun run test`: 110 file dan 834 pengujian lulus.
- Browser lokal dengan data dev Storylio: alt dan caption ketiga screenshot sesuai fixture pada lebar 1440px dan 390px; caption mengikuti pergantian slide; lightbox, keyboard, dan layout tanpa overflow lulus. Tidak ada pageerror.
- Pemeriksaan tipe lulus; lint lulus (953 file); diff whitespace bersih.
- Next.js get_compilation_issues kosong dan get_errors tidak melaporkan config/session errors.
- Review independen atas kode screenshot tidak menemukan masalah yang perlu ditindaklanjuti.

Screenshot hasil browser menggunakan data demo lingkungan dev, bukan aset produksi: `carousel-1440.png` dan `carousel-390.png`.

Belum di-deploy. Perbaikan HTML memperbaiki penerusan metadata dan penemuan gambar; tidak menjamin Google langsung memilih screenshot tambahan dalam hasil pencarian.
