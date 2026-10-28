# Review sumber VenomButton

> Catatan historis sebelum revisi. Screenshot Instagram kemudian diberikan
> pengguna dan prototipe diperbaiki; lihat `venom-revision.md`.

25 Oktober 2026. User meminta referensi ini menggantikan MagicButton pada CTA
hero dalam rencana redesign. Review inline terbatas pada source dan preview
terisolasi, bukan penilaian dua agen atau audit aksesibilitas lengkap. Tidak
mengubah komponen referensi, kode aplikasi, atau globals.css milik pengguna.

Sumber: `.docs/referensi/venom-button/VenomButton.tsx` dan
`VenomButton.module.css`. Source hanya bergantung pada React/ReactDOM, CSS,
SVG filter dan requestAnimationFrame, tanpa GSAP/Motion/WebGL.

## Yang terlihat

- Tombol pill hitam glossy, label putih, highlight melengkung di atas dan
  sedikit scale/rotate saat hover.
- Tujuh path kurva secara default ditarik dari bagian bawah tombol menuju
  ikon tangan yang mengikuti pointer dengan pegas/wobble. SVG filter memberi
  penyatuan bentuk. Ini tidak mendeformasi seluruh badan tombol menjadi cair.
- SVG ditempatkan lewat portal ke body; lapisan dekoratif tidak menangkap klik.
- Saat pointer terlalu jauh, efek dilepas dan kembali ke tombol. Frame loop
  berhenti ketika sudah kembali/diam setelah dilepas. Selama grabbed, efek
  masih aktif walaupun pointer tidak bergerak.
- Screenshot asli Instagram tidak ditemukan bersama source atau aset .docs.
  Capture ini adalah implementasi Claude yang sedang ditinjau, bukan acuan IG.

Preview menggunakan source tanpa perubahan, Satoshi dari aset proyek, satu
canvas terang dan satu canvas berisi gambar hero planet. Capture
`venom-source-comparison.png` dan `venom-dark-interaction.png` memperlihatkan
keadaan saat pointer ditarik. Ini belum komposisi CTA Home final.

## Temuan yang harus diperbaiki saat integrasi

1. API hanya menyediakan onClick, tanpa href/native link attributes. CTA About
   perlu Link/anchor sungguhan agar open-in-new-tab dan perilaku navigasi native
   tetap tersedia. Efek tidak perlu mengambil alih fungsi navigasi.
2. Tentakel memiliki stroke hitam literal; kontrasnya turun pada hero gelap.
   Pertimbangkan tinta terang atau tepi biru planet sambil mempertahankan bentuk
   organik. Ini keputusan adaptasi, bukan klaim warna referensi Instagram.
3. CSS memakai touch-action none dan handler grab tidak membatasi mouse/fine
   pointer. Pada mobile perlu CTA statis yang tidak menahan gesture scroll.
4. Reduced motion hanya diperiksa ketika effect pertama disiapkan. Uji browser
   mengaktifkan reduced motion saat grabbed menghasilkan cursor root none dan
   dua grup SVG masih terlihat. CSS menghentikan transform tombol, tetapi tidak
   menghentikan loop SVG aktif atau memulihkan kursor. Perlu listener/preferensi
   live dan cleanup saat berubah.
5. Root cursor diubah menjadi none lalu dikosongkan, tanpa menyimpan nilai
   awal. CSS tombol sendiri memiliki cursor pointer. Kebijakan cursor harus
   konsisten, diisolasi, dan memulihkan state sebelumnya. Hindari konflik bila
   ada lebih dari satu instance.
6. Overlay menggunakan z-index sangat tinggi. Batasi layering dan masa hidup
   efek agar tidak menimpa fokus/interaksi lain secara visual. Uji blur, keluar
   window, navigasi, unmount, serta scroll saat pointer berada dekat tombol.

Rekomendasi: layak sebagai interaksi khas CTA hero karena bentuk organiknya
berhubungan dengan GooeyNav, tetapi perlu batas motion agar hero tidak gaduh.
Jangan menerapkan ke semua tombol atau menambahkan animasi idle ke seluruh UI.
Ukuran dan radius akhir tetap mengikuti keputusan pengguna.

## Validasi dan batas

- Bundle source berhasil dibuat dengan esbuild lokal ke ignored .tmp.
- Preview Chromium 1440×900; hover/drag-away dan tampilan di hero gelap diperiksa.
- Ada dua instance button, tidak ada link, touch-action dihitung none.
- Uji reduced motion live menunjukkan efek belum berhenti sebagaimana di atas.
- Tidak membandingkan terhadap screenshot/video IG karena tidak tersedia.
- Tidak menguji gesture touch nyata, kontras numerik atau performa perangkat
  mobile. Belum ada klaim siap produksi atau kemiripan pixel dengan referensi.
- Server review port 3104 dan sesi browser ditutup sesudah review.

Self-review: accuracy 4/5 (bukti source/browser, acuan IG belum tersedia),
completeness 4/5 (perilaku utama dicek, touch/performance belum), clarity 5/5,
actionability 5/5 (rencana integrasi diperbarui), conciseness 4/5. 4.4/5.
Langkah berikutnya: bandingkan bentuk dengan screenshot dan geraknya dengan
video acuan dari pengguna sebelum menyatakan replika sudah sesuai.
