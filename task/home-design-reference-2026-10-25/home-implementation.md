# Hasil penerapan Home

24 Oktober 2026. Scope: rencana utama Home yang disetujui pengguna. Review dilakukan inline, bukan oleh agen independen.

## Perubahan

- Hero memakai pembagian ruang responsif, heading maksimum 72px dan crop gambar yang diturunkan. Copy, font, gambar astronaut, serta tujuan About dipertahankan.
- MagicButton mendapat ukuran compact opsional; default sm/md/lg tetap. Home menggunakan avatar 24px, ikon 16px, dan tinggi aktual 46px.
- Query Home memilih maksimal tiga proyek. Grid proyek dan blog sama-sama tiga kolom desktop, dua tablet, satu mobile, dengan container maksimum 1280px dan gap 24px.
- Kartu Home memiliki background hitam, border halus, padding gambar 8px, radius luar 16px dan radius gambar 8px. Metadata dan isi lebih ringkas; semuanya tetap link ke detail asli.
- ProjectCover dan BlogCover memiliki appearance="home". Radius serta fallback netral berlaku hanya pada Home; appearance default dan perilaku error gambar pada halaman lain dipertahankan. Cover kosong tidak lagi memakai mockup skeleton sebagai gambar proyek.
- Approach menampilkan Phase, judul dan deskripsi secara permanen dalam kartu 280px desktop dengan auto-height mobile. Canvas reveal tetap muncul lewat hover, keyboard dan tap, tanpa menyembunyikan isi.
- Komponen common/Card hanya dipakai oleh Approach berdasarkan pencarian consumer. Komponen ui/Card untuk auth/dashboard tidak diubah.
- Reduced motion menampilkan label statis dengan CSS. Markup server/client tetap identik; efek canvas tidak dirender. Ini memperbaiki mismatch hydration yang terdeteksi saat pengujian.
- Testimonial tetap memakai infinite cards; radius/border/background mengikuti token Home. Gooey Nav beserta perilaku scroll dan footer dipertahankan.
- Tidak menambah library, dependency, background animasi, CMS mutation, atau perubahan auth/database schema.

## Pengukuran hasil

Pada viewport 1818×983:

| Elemen | Sebelum | Sesudah |
| --- | --- | --- |
| Heading hero | y=154, tinggi 257px | y=262, tinggi 154px |
| CTA | 184×54px | 152×46px |
| Grid proyek | Dua kolom, item ketiga ke baris kedua | Tiga kolom, satu baris |
| Kartu proyek | Sekitar 656×594px | Sekitar 411×423px |
| Kartu Approach | Sekitar 392×523px, isi tersembunyi | Sekitar 411×280px, isi langsung terlihat |
| Radius luar/gambar | 12px / 25–31px | 16px / 8px |

Pada mobile 390px: CTA tetap 46px; judul hero y=216; grid satu kolom; Approach sekitar 215–241px sesuai panjang konten. Tidak memaksa semua konten ke tinggi tetap.

## Verifikasi

- Production build lulus, 35/35 route, termasuk TypeScript. Build final mengandung perbaikan hydration.
- Lint lulus; git diff --check lulus.
- Vitest 55 tes pada 10 file lulus dalam turn implementasi ini. Perubahan UI diuji terutama melalui browser.
- Browser pada 1818, 1440, 1024, 768, 390 dan 320px: tidak ada overflow; grid sesuai 3/2/1; maksimum tiga proyek; CTA 46px; radius 16/8px; judul/deskripsi Approach terlihat sebelum dan selama reveal.
- Hover mengaktifkan efek, meninggalkan kartu menghentikannya. Tap nyata pada context hasTouch mengaktifkan lalu mematikan efek. Konten tetap terbaca.
- Reduced-motion load lulus tanpa hydration/page error; kontrol efek disembunyikan, label statis dan isi tetap terlihat.
- Kegagalan request gambar Cloudinary dipaksakan dalam context terisolasi: tiga preview proyek jatuh ke fallback netral yang benar. Data tidak diubah.
- CTA About bekerja, navigation Home bekerja, navbar bersembunyi saat scroll turun dan kembali saat naik sedikit.
- Tidak menjalankan login, dashboard CRUD atau pengiriman email. Tidak mengklaim audit performa/kontras seluruh situs.

## Evidence

- evidence/browser-verification.json: ukuran dan hasil viewport/interaksi.
- evidence/touch-verification.json: tap serta kegagalan gambar.
- evidence/hero-*.png, projects-*.png, approach-*.png: hasil desktop/mobile.
- evidence/detector.json: 16 advisory terhadap root DESIGN.md referensi Framer (8 warna, 8 ukuran font). Perbedaan ini ditriase terhadap font dan arah Home yang dipilih pengguna; bukan alasan mengganti font atau mewarnai ulang gambar.

## Design record untuk Home

Canvas tetap oklch(0 0 0). Surface pendukung oklch(0.09 0 0), border default oklch(0.28 0 0). Radius card 16px, gambar 8px, kontrol fase 8px; Gooey Nav/CTA tetap pill dan avatar tetap bulat. Border, bukan glow, memisahkan kartu dari canvas.

Struktur berbeda mengikuti konten: hero bergambar, grid proyek/blog, proses yang dapat dibaca saat diam, serta testimonial bergerak. Efek yang sudah dipilih dipertahankan tanpa menambah pola background lain.

## Gate akhir

- Scope PASS: implementasi sesuai rencana utama; pilihan background/tabs opsional tidak dipasang; perubahan components.json milik pengguna dipertahankan.
- Truth PASS: tidak ada statistik/testimonial/gambar proyek baru yang dibuat-buat. Sumber hero dan konten CMS tetap; missing preview diberi label jujur.
- Function PASS dalam scope: build, unit suite, viewport, hover/tap, reduced motion, navigation dan fallback gambar tercatat pada evidence.
- Craft PASS dalam scope: font lama, radius konsisten, border lebih ringan, satu canvas hitam, judul proses terlihat, CTA About compact. Screenshot merupakan data dev, bukan validasi isi produksi.
- Tidak ada klaim full WCAG/performance certification atau persetujuan produksi eksternal.

## Self-review

Accuracy 4/5: pengukuran DOM dan browser mendukung hasil, tetapi kontras komposit foto tidak diukur menyeluruh. Completeness 4/5: seluruh rencana utama selesai; media proyek nyata tetap bergantung pada isi CMS. Clarity 4/5: batas Home/default cover dijelaskan. Actionability 4/5: source dan evidence siap ditinjau, server lokal dapat dipakai. Conciseness 4/5: detail disimpan di task agar ringkasan chat tetap singkat. Rata-rata 4,0/5.
