# Rencana redesign Home

25 Oktober 2026. Status: diterapkan pada 25 Oktober 2026 setelah pengguna meminta melanjutkan redesign Home. Lihat implementation.md untuk hasil dan verifikasi. Mulai dari
Home untuk membentuk bahasa visual yang kemudian diterapkan ke halaman lain.
Sumber: kode branch aktif, referensi lokal yang disebut pengguna, dan arsip
stash di `task/home-design-reference-2026-10-25/`.

Pengguna mengonfirmasi bahwa pengganti testimonial adalah catatan pribadi
tentang karya, bukan kutipan orang lain yang diberi tampilan baru.

## Tujuan dan arah

Portfolio personal yang menempatkan karya sebagai fokus, dengan suasana space
yang datang dari hero planet, kedalaman warna, dan gerakan yang terarah.
Home membantu pengunjung melihat proyek, memahami proses Heinz, membaca tulisan
dan catatan tentang karya, lalu menemukan profil/kontak yang benar-benar tersedia.
CTA About tetap menjadi usulan default berdasarkan arahan sebelumnya.
Tambahan arahan pengguna: CTA hero menggunakan referensi VenomButton sebagai
pengganti MagicButton; komponen sumber masih perlu adaptasi sebelum dipasang.

Pertahankan keluarga Clash Display, Satoshi, JetBrains Mono, aset hero planet,
logo terbaru, ProfileAvatar/LiveOrb dan GooeyNav. Ukuran dan radius final tetap
di tangan pengguna; rencana ini tidak menetapkan ulang angka radius dari stash.

Tidak memulihkan seluruh stash karena mencakup konsep, aturan warna lama dan
wrapper teknis yang sudah digantikan. Ambil hanya komposisi yang relevan. Stash
tetap aman. Produk, route asli, CMS, cache tags, partial prefetch, Proxy 404 dan
aturan publikasi tetap menjadi fondasi teknis.

## Temuan pada kode sekarang

- Home masih memakai hero Spotlight/TextGenerateEffect dan belum memasang
  `home-hero.avif`. Screenshot hero planet di arsip adalah keadaan historis.
- Proyek dibatasi empat, grid dua kolom desktop; tulisan dibatasi tiga dengan
  grid tiga kolom pada breakpoint xl.
- Approach memakai kartu canvas reveal dan tiga preset warna, sehingga efek
  visual lebih menonjol daripada informasi proses.
- `ClientsSection` menggabungkan testimonial bergerak dan logo CMS. Data logo
  belum membedakan teknologi dengan klien secara eksplisit.
- Footer saat ini hanya copyright/social. Referensi layout footer menawarkan
  heading, kolom navigasi, social strip, wordmark besar, dan baris bawah.
- Data Testimonial memiliki nama/peran/perusahaan/avatar/kutipan, bukan model
  catatan pribadi. Jangan mengganti arti data tersebut diam-diam.

## Urutan halaman yang disarankan

1. Hero planet + perkenalan singkat + CTA About.
2. Selected projects: maksimal tiga proyek, link ke seluruh proyek.
3. Approach: proses yang bisa dipahami tanpa interaksi.
4. Tech stack: logo/nama teknologi yang benar-benar dipakai.
5. Latest writing: maksimal tiga artikel umum.
6. Notes on the work: catatan pribadi tentang keputusan, eksperimen dan pelajaran.
7. Footer: penutup identitas, navigasi, social dan gerak reveal.

Proyek/blog tetap berupa grid agar mudah dibandingkan. Approach berbentuk daftar
proses, catatan mengutamakan teks, footer memakai wordmark besar. Perbedaan ini
memberi ritme tanpa mengandalkan perubahan warna background setiap section.

## 1. Background dan token

Rekomendasi: gelapkan canvas dan netralkan surface sedikit; pertahankan tiga
aksen biru planet, warna teks dan warna semantik yang sudah ada. Mengganti
background saja mungkin menyisakan card yang terlalu biru/terang, sehingga
canvas dan surface dinilai bersama pada preview Home.

Usulan awal untuk dibandingkan, belum nilai final:

| Peran | Usulan |
| --- | --- |
| Canvas | Hampir hitam dengan sedikit navy, sekitar `oklch(0.11 0.012 259)` |
| Surface kartu | Sekitar `oklch(0.15 0.012 259)` |
| Surface interaktif | Setingkat lebih terang, tetap tenang dan terbaca |
| Accent/link/focus | Biru planet yang sekarang, sesuai peran light/dark |
| Border | Halus tetapi terlihat; kontras input/focus diperiksa terpisah |

Mulai dari surface Home pada dark mode. Setelah ditinjau, naikkan keputusan yang
terbukti cocok ke token dark public shell untuk halaman publik berikutnya.
Perubahan root globals yang ikut menggelapkan dashboard bukan bagian otomatis
dari langkah Home. Light mode tetap diuji; preferensi dark tidak berarti
menonaktifkan light mode. Nilai contoh bukan hasil pengukuran kontras.

## 2. Hero dan proyek

Gunakan komposisi hero planet dari stash sebagai titik awal: gambar penuh,
heading terpusat, deskripsi singkat, CTA About dengan avatar default terbaru.
Sesuaikan crop desktop/mobile supaya planet dan astronaut tetap terbaca,
teks tidak tenggelam dalam cahaya gambar, dan awal section proyek terasa dekat.
Copy judul tetap diperiksa bersama pengguna; jangan mengganti fakta bio CMS.

Dasar CTA kini repo upstream yang diklon pengguna di
`.docs/referensi/venom-button/`, entry `index.html`, commit `ca890bd`.
Instruksi terbaru: abaikan prototipe/keputusan tombol sebelumnya; ikuti detail
repo, dengan pengecualian font dan ukuran mengikuti proyek. Prototipe lama di
`venom-prototype/` dan `venom-revision.md` hanya arsip, bukan spesifikasi aktif.

Yang dipertahankan dari upstream: bevel dan pantulan 3D, akar menyatu dengan
permukaan, serat pendek saat idle, reaksi mendekati kursor, tentakel yang
meregang/menipis/putus/recoil, serta gerak menggeliat saat aktif. Font Satoshi
14px/500, target minimal 44px, padding 12px/24px; bentuk pill mengikuti source.
Tidak membawa panel tuning atau drop/paste label ke halaman.

Kursor 3D dan lilitan per-jari upstream dipertahankan sesuai instruksi terbaru.
Keputusan native cursor sebelumnya tidak berlaku lagi. Penggantian kursor
dibatasi ke area efek dan dipulihkan saat keluar/pindah halaman.

Integrasi CTA sudah diterapkan di `src/components/common/venom-button.tsx` dan
renderer `src/components/effects/venom/`. Canvas transparan dan area efek sesuai hero
(demo upstream adalah scene layar penuh dengan lantai putih dan alpha false),
font Satoshi, Link About dengan semantik native, fallback tanpa WebGL,
touch/keyboard, reduced motion live, lifecycle/disposal React dan context loss.
Ukur biaya render bersama GooeyNav; hentikan efek di luar area terlihat/tab
tersembunyi, bukan ketika kursor diam selama interaksi. Sertakan atribusi MIT.
CTA mengikuti label polos upstream, tanpa avatar/ikon tambahan. MagicButton
di Approach tetap. Source clone belum diubah. Laporan implementasi:
`task/venom-cta-2026-10-25/report.md`. Redesign Home lainnya masih rencana.

Grid proyek mengikuti blog: tiga desktop lebar, dua tablet, satu mobile.
Ambil maksimal tiga proyek terpublikasi dengan urutan featured/order yang
berlaku. Samakan container dan ritme grid proyek/blog; sesuaikan image sizes
dengan lebar kartu baru. Cover asli tetap dominan, metadata lebih ringkas,
border lebih tenang dan glow ungu literal diganti token yang sesuai.
Jumlah konten kurang dari tiga tidak ditambal dengan proyek palsu.

## 3. Approach

Rekomendasi utama: daftar proses berurutan. Desktop mempunyai intro di kiri
dan baris fase di kanan, dengan nomor kecil, judul, ringkasan dan pemisah halus.
Mobile menjadi satu kolom. Semua fase terbaca tanpa hover/tap. Efek hover cukup
pada border/nomor atau indikator langkah; canvas berwarna tidak menjadi pusat
section ini. Hormati jumlah dan urutan PHASE dari CMS, tidak wajib selalu tiga.

Alternatif bila ingin lebih interaktif: daftar accordion, satu fase terbuka
secara awal. Ini belum dipilih; usulan utama daftar terbuka lebih mudah dibaca
dan membatasi jumlah animasi yang bersaing dengan navbar/footer.

## 4. Tech stack

Sumber tepat: `.docs/referensi/logo-clouds.tsx.bak`, bukan varian smooth-ui.
Referensi menganimasikan wipe/blur pada logo yang sama; namanya “Swap” tidak
berarti source benar-benar mengganti daftar teknologi.

Adaptasi: ikon + nama, baris yang membungkus di desktop dan grid ringkas mobile.
Gunakan judul seperti “Tools I work with”, bukan klaim trusted-by/client.
Kurasi entri LOGO yang memang teknologi; jangan menganggap semua logo CMS
sebagai skill atau perusahaan klien. Jika ikon tidak ada/gagal, nama tetap tampil.
LOGOS utility dan ikon default referensi belum tersedia di repo: gunakan sumber
ikon yang disetujui/aset yang tersedia, bukan import yang tidak ada.

Gerak wipe ringan bertahap saat section pertama terlihat; hover/focus boleh
memperjelas satu item. Usulan awal menghindari blur besar dan loop 3,2 detik.
Jika loop dipilih nanti, wajib ada pengendalian pause, berhenti di luar viewport
dan saat tab tidak aktif. Reduced motion menampilkan grid statis.

## 5. Catatan pribadi menggantikan testimonial

Nama usulan: “Notes on the work”. Kartu teks berisi judul, tanggal, excerpt dan
link membaca catatan. Fokus pada keputusan saat mengerjakan proyek, eksperimen,
trade-off dan pelajaran; isi baru harus berasal dari pengguna.

Interpretasi referensi: ambil hierarki teks, pemisah, dan metadata ringkas dari
`.docs/referensi/landing/testimonial.tsx.bak`; ubah maknanya menjadi catatan
personal. Tidak menyalin nama/kutipan, badge DM/LinkedIn, atau tampilan penilaian
klien. Usulan utama grid catatan statis; teks tidak bergerak terus saat dibaca.

Sumber data usulan: Post terpublikasi bertag khusus `notes`, dikelola melalui
editor blog yang sudah ada. Ini konvensi baru yang perlu ditetapkan, bukan tag
yang diklaim sudah ada. URL tetap `/blog/[slug]`, sedangkan kumpulan catatan
dapat memakai `/blog?tag=notes`. Filter daftar artikel umum dan daftar notes
secara terpisah sebelum limit, supaya artikel tidak terduplikasi dan satu
section tidak kehabisan item hanya akibat pemotongan hasil query.

Hapus testimonial dari komposisi/query Home, tetapi jangan menghapus tabel atau
isi CMS lama. Jika belum ada catatan, section disembunyikan pada publik; panduan
editor menjelaskan cara menambahkannya. Tidak menampilkan catatan rekaan.
Usulan ini tidak memerlukan migrasi DB. Jika pengguna menginginkan notes pendek
tanpa halaman artikel, itu membutuhkan kontrak konten/CMS berbeda dan dibahas
sebelum implementasi, bukan memakai field Testimonial secara paksa.

## 6. Footer: layout dan animasi dari dua sumber

Layout dari `.docs/referensi/footer/index.tsx.bak`: heading personal di atas,
kelompok navigasi/social, wordmark Heinz besar, divider dan copyright bawah.
Sesuaikan konten dengan route serta social CMS yang ada. Kolom kantor, alamat,
legal text, link `#` dan nama brand contoh tidak dibawa ke Storylio.

Gerakan dari `.docs/referensi/footer.tsx.bak`: curtain reveal saat footer
memasuki viewport, wordmark bergeser/membesar perlahan mengikuti scroll,
serta kemunculan isi secara bertahap. Pertahankan rasa animasinya, bukan
layout layar penuh referensi yang berisi app-store buttons.

Desktop: uji efek reveal dalam wrapper yang menampung tinggi konten nyata.
Mobile/viewport pendek: footer mengikuti aliran dokumen dengan gerak lebih
pendek; seluruh link tetap dapat dicapai. Reduced motion memakai footer statis.
Periksa transform ancestor dari RouteMotion, clipping, fokus keyboard,
scroll-to-top dan perubahan tinggi saat font/data siap. Footer tidak boleh
menutupi konten atau memaksa 100vh sehingga link terpotong.

Usulan awal memakai Motion/CSS yang sudah ada untuk menyamai mekanisme visual,
tanpa menambahkan GSAP hanya karena dipakai referensi. Pilihan API/teknik final
diverifikasi dari dokumentasi versi terpasang sebelum implementasi. Scope efek
baru pada Home dahulu agar perubahan shared footer tidak langsung mengubah
About/Blog/Projects/Dashboard tanpa review.

## Tahap pengerjaan setelah arah disetujui

| Tahap | Hasil yang bisa ditinjau | Syarat selesai |
| --- | --- | --- |
| A. Dasar + hero | Preview Home dengan canvas lebih gelap dan hero planet | Crop, teks, CTA, font, navbar dan light/dark terbaca |
| B. Proyek + tulisan | Grid dan kartu memakai aturan yang sama | 3/2/1, link asli, cover gagal/kosong, judul panjang aman |
| C. Approach + stack | Proses terbaca dan daftar teknologi terkurasi | Keyboard/mobile, nama logo, reduced motion dan konten sedikit aman |
| D. Notes | Pengganti testimonial berisi catatan personal | Publikasi/tanggal/tag benar, tidak duplikat, konten lama tidak hilang |
| E. Footer | Layout referensi dengan curtain/wordmark reveal | Seluruh link dapat dijangkau, desktop/mobile, tanpa clipping/focus tersembunyi |
| F. Konsolidasi | DESIGN dan komponen/token yang bisa digunakan halaman lain | Tidak ada override Home yang tanpa sengaja mengubah editor/dashboard |

Pemeriksaan akhir: lint/typecheck/unit suite/build sesuai repo; browser pada
320, 390, 768, 1024 dan 1440px, dark/light, keyboard, reduced motion, fallback
gambar, scroll restore, navbar WebGL fallback, navigasi hangat/dingin serta 404.
Uji footer dengan viewport pendek dan tanpa animasi; konten SSR harus tetap
tersedia. Ukur perubahan JS/animasi terhadap baseline sebelum mengklaim lebih
cepat. Review desktop dan mobile dalam satu putaran, perbaiki temuan bersama,
lalu satu putaran konfirmasi. Tidak menjalankan tes/build untuk rencana saja.

## Lanjutan sesudah Home

Urutan usulan: Projects index/detail, Blog index/detail (termasuk notes), About,
Gallery, lalu auth/dashboard sebagai permukaan tugas dengan kepadatan sendiri.
Gunakan token/type/nav/footer yang sudah diuji; jangan menyalin hero dan animasi
Home ke setiap halaman. Shared footer diaktifkan per layout sesuai review.

## Keputusan terbuka dan batas perencanaan

- Catatan personal sudah dikonfirmasi. Tag `notes`, jumlah item dan gaya teks
  masih proposal. Radius/ukuran final mengikuti preferensi pengguna.
- Background hampir hitam dengan aksen biru dipertahankan adalah rekomendasi,
  belum perubahan root tokens. Daftar Approach terbuka adalah rekomendasi utama.
- Tidak membuka server atau mengklaim audit visual UI terbaru. Source dan
  screenshot historis diperiksa. Rencana tidak mengubah src, DESIGN atau DB.
- PRODUCT.md dari stash tidak aktif; product context sementara diambil dari
  source, percakapan dan referensi tersimpan. Pencatatan konteks final dapat
  dilakukan bersama keputusan implementasi, tanpa memulihkan dokumen lama.

Self-review: accuracy 4/5 (source spesifik diperiksa, belum visual runtime baru),
completeness 5/5 (enam area dan klarifikasi notes tercakup), clarity 4/5 (detail
teknis ditaruh di sini), actionability 5/5 (tahap, data dan acceptance criteria
jelas), conciseness 4/5 (dokumen lengkap; respons chat lebih ringkas). 4.4/5.
Perbaikan berikutnya: validasi komposisi melalui preview setelah pengguna
menyetujui arah; jangan menganggap rencana sebagai persetujuan implementasi.
