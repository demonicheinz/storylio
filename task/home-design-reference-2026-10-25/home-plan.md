# Rencana perbaikan Home

Tanggal: 24 Oktober 2026. Status: rencana utama disetujui dan diterapkan. Hasil serta verifikasi ada di IMPLEMENTATION.md. Background animasi tambahan dan penggantian Approach menjadi tabs/accordion tidak dipilih.

## Arah yang disarankan

Pertahankan Gooey Nav, background astronaut, font sekarang, CTA About, footer besar, serta efek Approach dan Testimonial yang sudah dipilih. Perbaiki proporsi, isi saat diam, permukaan, dan radius terlebih dahulu. Tambahan background animasi adalah opsi terakhir, bukan langkah awal.

Hasil yang dituju: hero terasa lebih seimbang, proyek tidak mendominasi dua baris, Approach dapat dipahami tanpa hover, dan warna abu tidak membentuk lapisan frame di mana-mana.

## Bukti audit

Diperiksa lewat Brave profil Dev dan kode repo. Home lokal dibuka di tab audit tersendiri pada localhost:3000. Ukuran berikut adalah hasil desktop sekitar 1818×983 CSS px, bukan ukuran universal atau hasil benchmark:

| Elemen | Kondisi saat audit, sebelum implementasi | Dampak |
| --- | --- | --- |
| Navbar | Top 20px, tinggi 54px | Batas bawah sekitar 74px; heading mulai y=154, selisih sekitar 80px |
| Hero | Tinggi sekitar 865px | Blok teks tampak berada di bagian atas; seluruh komposisi belum terpusat vertikal |
| Heading | Tinggi sekitar 257px | Tiga baris besar membawa sebagian besar bobot visual |
| CTA | Sekitar 184×54px | Kombinasi avatar 28px dan padding vertikal membuat tombol lebih berat daripada teks pendukung |
| Proyek | Tiga item dalam grid dua kolom, kartu sekitar 656×594px | Item ketiga turun ke baris kedua dan section menjadi sangat panjang |
| Approach | Tiga kartu sekitar 392×523px | Saat diam hanya terlihat Phase, sedangkan judul/deskripsi menunggu active state |
| Kartu proyek/blog | Radius luar 12px | Gambar di dalam memakai radius sekitar 25–31px, sehingga sudut/frame tidak konsentris |
| Surface | Card, gambar, badge, tombol dan wrapper punya layer masing-masing | Abu terasa lebih banyak karena banyak bidang bersarang, bukan sekadar satu nilai warna |

Kode yang mengonfirmasi: home.css mengatur padding hero tetap 154px dan radius card 12px; recent-projects.tsx memakai md:grid-cols-2; query Home mengizinkan empat proyek; common/card.tsx memakai aspect-3/4 dan baru merender judul/deskripsi ketika active. ProjectCover dan BlogCover masih membawa radius serta gradient fallback dari tema sebelumnya.

## 1. Hero: tetap center, tetapi seimbangkan secara vertikal

Hero sudah rata tengah horizontal. Menambahkan text-center lagi tidak menyelesaikan masalah. Usulan utama:

- Posisikan blok heading, deskripsi dan CTA sebagai satu grup di area aman di bawah navbar. Gunakan pembagian ruang responsif, bukan padding-top tetap untuk semua tinggi layar.
- Sebagai sampel awal, turunkan grup sekitar 48–72px di desktop dan 24–40px di mobile dibanding posisi sekarang. Angka akhirnya ditentukan oleh capture, bukan hard-coded untuk satu layar.
- Kurangi dominasi heading secukupnya, uji rentang desktop 64–72px dan wrapping 2–3 baris. Pertahankan copy saat ini untuk perbandingan yang adil; perubahan copy membutuhkan keputusan terpisah.
- Periksa framing gambar bersamaan: CTA tidak boleh menutupi kepala astronaut. Menurunkan teks tanpa meninjau crop akan memindahkan masalah.
- Jangan memaksa seluruh grup tepat di 50% layar jika itu bertabrakan dengan subjek gambar atau membuat proyek makin jauh di bawah.
- MagicButton dan avatar tetap dipakai. Buat ukuran compact untuk Home saja: target tinggi sekitar 44–46px, avatar 22–24px, teks 14px, padding horizontal 16–20px. Jangan mengubah default semua MagicButton atau Phase pill di Approach.
- Navbar tetap floating, terpusat, framed, dan muncul saat scroll sedikit ke atas. Footer tetap dipertahankan.

Selesai ketika: jarak hero/navbar terasa lapang pada tinggi layar pendek maupun tinggi; CTA tidak mendominasi dan tetap nyaman disentuh; teks tidak hilang saat loading atau reduced motion.

## 2. Proyek: tiga kolom, satu baris di desktop

Usulan pengguna cocok untuk isi Home yang sekarang. Terapkan maksimal tiga proyek pilihan, bukan semua proyek dalam archive.

- Desktop tiga kolom, tablet dua, mobile satu. Jangan memaksakan tiga kolom pada layar sempit.
- Samakan lebar container dan gap dasar dengan Blog dan Approach; usulan container 1240–1280px dengan gap 24px.
- Ringkas kartu: preview, judul, deskripsi dua baris, metadata seperlunya. Kurangi ruang footer CTA yang berulang jika seluruh kartu sudah menjadi link.
- Jangan mengunci tinggi piksel yang memotong judul atau memperkecil teks. Samakan ritme/lebar, bukan memaksa semua jenis kartu memiliki tinggi yang identik.
- Query Home dibatasi tiga agar proyek keempat tidak menciptakan baris kedua. Data CMS tidak dihapus; sisanya tetap lewat View all projects.
- Jika item hanya satu atau dua, tampilkan yang tersedia tanpa membuat kartu placeholder palsu.

Selesai ketika: tiga proyek membentuk satu baris pada desktop, kualitas thumbnail tetap jelas, tidak ada overflow, dan Blog tidak terasa jauh lebih kecil karena perbedaan grid.

## 3. Approach: selesaikan kekosongan isi dahulu

Masalah utama adalah kartu portrait 523px yang hanya menampilkan Phase pada state idle. Mengganti abu menjadi hitam saja akan menghasilkan kartu kosong yang lebih gelap.

Rekomendasi utama, mempertahankan komponen dan efek yang sudah dipilih:

- Tampilkan nama fase dan ringkasan singkat secara permanen. Phase cukup menjadi metadata, bukan satu-satunya isi.
- Turunkan proporsi menjadi kartu yang lebih pendek; uji sekitar 260–320px pada desktop, auto-height pada mobile. Lepaskan aspect-3/4.
- Background kartu hitam, border halus. Tidak perlu menambahkan satu panel abu besar di belakang seluruh section.
- Pertahankan canvas reveal sebagai respons hover/tap/focus, bukan syarat untuk membaca informasi. Nama fase dan ringkasan harus tetap terbaca saat efek aktif.
- Bila perlu tekstur saat diam, uji pola statis tipis pada sebagian area kartu. Bandingkan dengan versi tanpa pola sebelum menambah motion.

Alternatif jika pengguna ingin mengganti bentuk interaksi: Direction Aware Tabs dari Cult UI atau pola Accordion dari Motion Primitives. Tiga fase dapat memakai satu panel konten. Ini perubahan bentuk, bukan sekadar polish; jangan diterapkan otomatis karena sebelumnya pengguna meminta Approach dipertahankan.

Selesai ketika: pengunjung memahami tiga fase tanpa menggerakkan mouse; hover/tap tetap memberi pengalaman; mobile dan keyboard tidak kehilangan isi.

## 4. Surface: satu canvas, sedikit bidang terangkat

- Canvas tetap oklch(0 0 0).
- Kartu konten memakai background hitam atau nyaris hitam dengan border, bukan frame abu tebal. Padatkan inset gambar menjadi sekitar 8px.
- Simpan surface charcoal yang lebih jelas untuk navbar, popup, field, dan bagian interaktif yang membutuhkan pemisahan.
- Bedakan border default/hover melalui token yang sama; jangan menambah shadow/glow untuk memperjelas semua kartu.
- Badge metadata dibuat lebih ringan agar di dalam satu kartu tidak ada terlalu banyak kapsul abu yang bersaing.
- Hilangkan warna ungu yang masih tertulis literal pada fallback cover Home melalui variant yang tepat. Jangan mewarnai ulang gambar konten atau merombak halaman lain secara tidak sengaja.
- Pertahankan testimonial/infinite cards, tetapi gunakan token surface dan radius yang sama agar tidak menjadi sistem terpisah.

Selesai ketika: pada tangkapan grayscale tidak terlihat frame di dalam frame tanpa fungsi; kartu tetap mudah dipisahkan dari canvas; focus dan state masih jelas.

## 5. Radius: tentukan hubungan luar dan dalam

| Elemen | Usulan |
| --- | --- |
| Card proyek/blog/Approach/testimonial | 16px |
| Gambar di dalam card dengan inset 8px | 8px |
| Input/menu/kontrol persegi | 8px |
| Badge kecil | 6–8px, tanpa menambah panel di belakangnya |
| Gooey Nav dan MagicButton | Pill sebagai pengecualian fungsional yang disengaja |
| Avatar | Bulat |

Tidak semua elemen harus punya radius sama. Yang penting hubungan ukurannya konsisten. Radius gambar yang lebih besar daripada card luarnya perlu dihilangkan.

Implementasi berikutnya sebaiknya merapikan class/variant di komponen yang relevan, bukan terus menambahkan override semakin spesifik di home.css. Shared cover diberi varian atau radius Home yang jelas supaya Blog/Projects lain tidak ikut berubah tanpa ditinjau.

## Referensi yang diperiksa pada Brave Dev

Tab pengguna dibiarkan terbuka. Tidak ada pemasangan package, transaksi, login, atau perubahan konfigurasi browser.

| Referensi | Dipakai untuk apa | Keputusan |
| --- | --- | --- |
| Watermelon UI + referensi Hero38/Footer17 yang sudah ada | Ritme section, framing hero, penutup besar | Pertahankan arah, jangan ganti template lagi |
| Cult UI Minimal Card | Studi nesting gambar, isi dan frame | Kandidat bentuk kartu; belum diadopsi atau dinilai implementasinya |
| Cult UI Direction Aware Tabs | Panel fase dengan transisi mengikuti arah | Alternatif Approach jika perubahan bentuk dipilih |
| Motion Primitives Accordion/Disclosure | Pengungkapan detail yang lebih ringkas | Alternatif detail mobile; ringkasan utama tetap terlihat |
| Magic UI Flickering Grid | Tekstur monokrom dalam area terbatas | Opsional setelah proporsi dan isi beres; tidak dipasang di seluruh Home |
| React Bits Pattern Waves | Gerak permukaan halftone | Cadangan untuk satu area; terlalu mudah bersaing dengan hero bila dipakai luas |
| Aceternity Background Beams | Studi latar dengan jalur cahaya | Tidak direkomendasikan untuk tahap ini: hero sudah punya sumber cahaya besar dan kita sedang mengurangi dekorasi |
| beUI Bloom Menu | Menu aksi yang mekar dari tombol | Tidak dibutuhkan; Gooey Nav sudah menjadi interaksi navigasi yang dipilih |
| SmoothUI Wallet Card, Bklit charts, Vengeance circular gallery | Pola domain lain | Tidak menyelesaikan masalah Home ini secara langsung |
| Groot Studio / Kokonut / 21st / Tailark | Katalog tambahan | Tidak perlu menggabungkan gaya semuanya. Katalog diperiksa sesuai relevansi, bukan audit semua komponennya |

Detail sumber yang diverifikasi: Cult UI mendeskripsikan Direction Aware Tabs sebagai tabs dengan slide berdasarkan arah dan tinggi panel yang beradaptasi. Magic UI menyediakan pengaturan opacity/grid/flicker pada contoh Flickering Grid. Pattern Waves menyediakan kontrol opacity, fade, speed, interactive dan paused; paused saja bukan pengganti reduced motion karena interaksi cursor masih dapat aktif. Halaman Pattern Waves menyebut dependency ogl, sedangkan package.json Storylio tidak mencantumkannya sebagai dependency langsung. Jangan menambahnya hanya untuk mengisi ruang.

Sumber publik:

- `https://www.cult-ui.com/docs/components/direction-aware-tabs`
- `https://www.cult-ui.com/docs/components/minimal-card`
- `https://motion-primitives.com/docs/accordion`
- `https://magicui.design/docs/components/flickering-grid`
- `https://reactbits.dev/backgrounds/pattern-waves`
- `https://ui.aceternity.com/components/background-beams`
- `https://beui.dev/components/blocks/bloom-menu`
- `https://ui.watermelon.sh/home`

Pemeriksaan ini menilai relevansi pola, bukan persetujuan menyalin implementasi. Jika komponen dipilih, tinjau source, lisensi, dependency, aksesibilitas, reduced motion, dan kecocokan Base UI sebelum diadaptasi. Primitive Base UI, Phosphor, Motion, cache/prefetch, route dan data CMS tetap dipertahankan. Tidak memasukkan Radix/Sonner kembali hanya karena contoh pihak lain menggunakannya.

## Urutan pekerjaan setelah rencana disetujui

1. Konsolidasikan keputusan radius, canvas, surface, border dan ukuran compact CTA.
2. Rapikan grid tiga proyek dan nesting radius gambar. Periksa satu kartu proyek dan satu kartu blog dengan konten nyata.
3. Tata ulang area hero dan crop bersama-sama; bandingkan pada desktop serta mobile.
4. Rapikan idle state Approach dan tinggi kartu, mempertahankan efek reveal.
5. Periksa transisi antarseksi, testimonial, dan footer pada satu putaran halaman utuh.
6. Baru bandingkan versi tanpa tekstur dengan satu tekstur opsional. Jangan menggabungkan Grid, Waves dan Beams sekaligus.

Setiap tahap tetap dalam scope Home dan komponen bersama yang memang diperlukan. Tidak mengganti auth/dashboard pada pekerjaan ini.

## Kriteria penerimaan implementasi

- Capture pada viewport pengguna sekitar 1818×983, desktop 1440×960, tablet 768px dan mobile 390/320px.
- Navbar tetap di tengah, memiliki background, tidak kehilangan label, dan muncul setelah scroll sedikit ke atas.
- Hero terasa lebih turun/seimbang; CTA masih About, tingginya sekitar 44–46px, tidak menutupi subjek foto, dan tidak mengurangi area tekan di bawah 44px.
- Tiga proyek, satu baris pada desktop; dua/satu kolom di layar lebih kecil, tanpa pemotongan data.
- Semua fase Approach dapat dipahami tanpa hover, dengan focus/tap/reduced-motion yang layak.
- Canvas tetap hitam; tidak ada legacy palette; radius luar/dalam serta border konsisten.
- Missing-image, empty, judul panjang, warna kontras dan fallback gerak diperiksa.
- Jalankan lint, typecheck/build dan browser regression yang relevan saat kode benar-benar diubah. Tidak menjalankan tes sekarang karena deliverable saat ini hanya rencana.

## Hal yang belum diputuskan

Tekstur tambahan dan penggantian bentuk Approach menjadi tabs/accordion adalah opsi, bukan bagian yang otomatis disetujui. Rekomendasi utama adalah kartu yang lebih ringkas dengan isi terlihat, background hitam, tanpa background animasi baru.

## Pemeriksaan deliverable

- Scope PASS: tidak ada source aplikasi, dependency, CMS atau credential yang diubah dalam tahap ini.
- Evidence PASS: ukuran desktop diperiksa dari DOM Home aktual; perbedaan grid dan conditional content diperiksa pada source.
- Purpose PASS: setiap rekomendasi dikaitkan dengan hierarki, keterbacaan atau konsistensi; komponen library tidak dijadikan kewajiban.
- Truth PASS: angka di tabel adalah pengamatan pada viewport yang disebut, bukan target universal atau metrik performa.
- Gate produksi belum berlaku: ini rencana. Tidak mengklaim kontras/performa/aksesibilitas seluruh aplikasi sudah lulus.

Self-review: accuracy 4/5 (kode dan DOM mendukung temuan, belum semua preview background dilihat pada viewport awal); completeness 4/5 (seluruh keluhan dan pilihan referensi tercakup, audit kode library belum dilakukan); clarity 4/5 (proposal dipisahkan dari observasi); actionability 4/5 (urutan dan acceptance criteria spesifik); conciseness 4/5 (detail berada di file ini). Rata-rata 4,0/5. Perbaikan berikutnya harus dinilai lewat perbandingan visual bersama pengguna, bukan putaran polish spekulatif tambahan.
