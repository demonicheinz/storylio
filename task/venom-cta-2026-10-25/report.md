# Venom CTA — 25 Oktober 2026

CTA Home sekarang memakai renderer/fisika asli exteestudio/venom-button
(`ca890bd`, MIT), dengan font/ukuran Storylio. Instruksi terakhir pengguna
menggantikan seluruh arahan prototipe lama, termasuk larangan custom cursor.
Source clone di `.docs/referensi/venom-button/` tetap utuh.

## Perubahan

- `src/components/common/venom-button.tsx`: Link Next.js yang tetap tersedia
  sebelum hydration dan saat efek tidak tersedia. Lazy-load renderer saat
  terlihat, pointer presisi, dan tidak reduced motion. Menunggu font proyek.
- CSS: Satoshi 14px/500, line-height 1.2, padding 12px/24px, target minimum
  44px. Geometri pill dipertahankan sesuai upstream. Warna/material hitam
  adalah pengecualian desain eksplisit untuk efek ini, dicatat di DESIGN.md.
- `src/components/effects/venom/`: port renderer tiga pass, studio reflection,
  SDF, fillet akar, Verlet, probes/micro strands, stretch/snap/recoil, lilitan
  jari, dan kursor 3D. Lisensi dipertahankan. Tidak memasukkan font Geist.
- Canvas dibatasi sekitar tombol dan memakai premultiplied alpha; lantai putih
  demo tidak menutup hero. Font/dimensi/posisi diambil dari DOM link.
- Cleanup rAF, event listeners, observers, images, GPU resources, dan cursor
  ownership. Efek dihentikan saat offscreen/tab hidden/unmount. Context loss
  mengembalikan CSS link; touch/reduced motion memakai fallback statis.
- Hero memakai label CMS dan href semula. Avatar/arrow dekoratif CTA lama
  tidak dibawa ke label polos upstream. MagicButton di Approach tetap.
- Tidak memasukkan panel tuning, paste/drop SVG, clipboard, ataupun debug API
  demo. Tidak mengubah DB, cache/prefetch, atau deploy/commit/push.
- Perubahan `src/app/globals.css` sudah ada sebelum tugas dan tidak disentuh.

## Verifikasi

- `bun run typecheck`: lulus.
- `bun run build`: lulus (kompilasi, TypeScript, prerender 36 halaman).
- Biome delapan file source/test/config yang relevan: lulus; `git diff --check`
  lulus. Source numerik vendor JS dipertahankan dengan boundary deklarasi TS,
  bukan diklaim sebagai port TypeScript penuh.
- `tests/browser/venom-button.js` pada localhost:3000, Chromium terisolasi:
  font Satoshi 14px/500 dan tinggi 44px; material nonkosong dan transparansi
  terverifikasi lewat readPixels; frame berubah dengan mouse diam; tidak ada
  error WebGL/exception runtime; klik WebGL ke About tanpa document reload;
  cleanup saat navigasi dan satu canvas saat Back; keyboard/reduced motion
  live; offscreen/remount; context loss; no-WebGL; touch navigation.
- No-WebGL init script berada di halaman tersendiri dan ditutup setelah tes.
  Sesi CLI utama dapat digunakan lagi. Tes focus-visible diperbaiki agar
  memakai keyboard modality (ArrowRight setelah focus), bukan mouse modality.
- Mobile 390px diperiksa lagi setelah transisi menampilkan CTA: target 44px,
  font benar, tanpa canvas, tanpa overflow horizontal. Screenshot mobile
  menangkap CTA; animasi headline yang sudah ada masih bisa sedang berjalan.
- Suite Vitest: run awal 114/116 lulus, dua timeout pada Projects dan Dashboard
  Analytics di `route-shells.test.ts` saat build/browser berjalan bersamaan.
  Run terpisah file itu lulus 17/17 dalam 16.01s. Dengan 99 tes di file lain
  yang sudah lulus, seluruh kasus terverifikasi; bukan klaim satu run 116/116.
  Run sandbox sebelumnya tidak selesai dan dibatalkan; run tercatat di atas
  memakai izin worker proses lokal.

Screenshot `home-pull.png` dan `home-mobile.png` berasal dari browser aktual.
Perintah ulang tersedia di README (`bun run test:browser:venom`). Server dev
pengguna di port 3000 tetap berjalan; sesi browser pengujian ditutup.

## Batas

Belum ada benchmark GPU lintas perangkat, Safari/Firefox, atau audit screenshot
pixel-identik terhadap upstream. Material aslinya dipertahankan, sedangkan
white-floor compositing, font, ukuran dan area efek memang berubah untuk
integrasi. Efek WebGL memakai lebih banyak kerja GPU dibanding tombol CSS;
lazy import, area canvas terbatas dan penghentian offscreen mengurangi cakupan,
bukan bukti target FPS tertentu. Reduced motion saat ini memakai CSS fallback
statis, bukan shader statis. Redesign Home lain masih berupa rencana.

Self-evaluation: accuracy 4/5 (build + browser + test evidence, fidelity/performa
lintas perangkat belum diukur), completeness 5/5 (CTA dan fallback selesai),
clarity 5/5 (perubahan upstream/integrasi dibedakan), actionability 5/5 (kode
dan perintah tes tersedia), conciseness 4/5 (vendor numerik besar dipertahankan
untuk fidelity). Rata-rata 4.6/5. Langkah peningkatan berikutnya: profil GPU
pada perangkat pengguna, lalu uji Safari/Firefox. Penilaian kemiripan akhir
tetap milik pengguna; skor ini tidak menggantikan penerimaan visual.
