# Screenshot metadata fix

Dashboard menyimpan caption dan altText, query publik juga mengambil keduanya. ProjectScreenshots meneruskan alt ke DepthCarousel, tetapi CarouselImage menimpanya dengan string kosong. Caption hanya disalurkan ke lightbox.

Perbaikan: pakai alt tersimpan beserta fallback yang sudah ada, tampilkan caption aktif di bawah carousel, sembunyikan hanya lapisan yang tidak aktif dari teknologi bantu, dan pertahankan semua img pada HTML awal. Slide di luar tiga lapisan diberi hidden dan native lazy loading agar file tidak diunduh semuanya sekaligus. Tidak ada pengisian ulang CMS, migrasi, atau perubahan Gallery.

Verifikasi: uji regresi server-render terlebih dahulu; suite Vitest, pemeriksaan tipe/lint; browser lokal untuk alt/caption, navigasi/lightbox, responsif, serta tidak memuat file slide hidden sebelum diperlukan. Pertahankan perubahan About dari tugas sebelumnya.
