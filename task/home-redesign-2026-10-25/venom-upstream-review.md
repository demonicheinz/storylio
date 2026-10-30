# Repo VenomButton yang diklon pengguna

> Catatan historis sebelum instruksi terakhir. Pengguna kemudian memilih detail
> repo termasuk kursor 3D, dengan font/ukuran proyek. Preferensi native cursor
> yang disebut di bawah sudah tidak berlaku. Implementasi aktual dicatat di
> `task/venom-cta-2026-10-25/report.md`.

25 Oktober 2026. Pemeriksaan lokal source/dokumentasi/preview.jpg;
bukan benchmark atau verifikasi runtime browser pada repo upstream.

- Lokasi: `.docs/referensi/venom-button/`, commit `ca890bd`
  (`Add breakdown & process docs`), working tree clone bersih saat diperiksa.
- README mengidentifikasi proyek exteestudio/venom-button. Entry satu file
  `index.html` sekitar 159 KB, termasuk font embedded. Tanpa dependency/build.
- License MIT © 2026 exteestudio; notice disertakan ketika memakai source.
  Font embedded Geist punya lisensi terpisah OFL. Font Storylio tetap Satoshi.
- Source nyata memakai WebGL2: shape/height-normal pass, shading pass,
  lalu FXAA. Slab/tentakel/cursor memakai SDF; smooth minimum menyatukan akar.
- Fisika: 14 titik per strand, substep 1/240 s, stretch/creep/slither,
  penipisan, snap, recoil. Gerak pendek saat idle melalui nextProbe/crawlers,
  terpisah dari tentakel yang mengikat kursor.
- Pantulan bukan gradient CSS: material/shading di FRAG_SHADE,
  normal permukaan, room/window reflection, rim dan contact shadows.
- Tangan 3D memang ada di source; body.is-engaged menyembunyikan cursor.
  Preferensi native cursor pengguna tetap berlaku, bukan dibatalkan oleh repo.

## Dasar adaptasi

Pakai renderer/fisika upstream untuk prototipe berikutnya. Prototipe SVG/CSS
sebelumnya tetap arsip, bukan kandidat integrasi utama. Jangan menyalin demo
layar penuh langsung ke hero: source memakai alpha false, innerWidth/innerHeight,
lantai scene, event global, loop permanen, panel tuning dan drag/drop/paste SVG.

Port perlu membatasi area canvas, transparansi/compositing latar, font aplikasi,
ukuran/radius pengguna, Link About, lifecycle/disposal, fallback, penanganan
context loss, reduced motion live (source membaca matches sekali), dan
touch-action yang tidak mengunci scroll. Ukur efek bersama GooeyNav sebelum
menganggap biaya render cocok. Ini daftar pekerjaan lanjutan, belum dikerjakan.

Menghapus cursor 3D juga perlu mengganti titik perlekatan ke sekitar posisi
pointer; hanya menghapus CSS cursor:none meninggalkan dua cursor dan wrap
geometry. Native cursor tetap bisa digunakan, tetapi lilitan per-jari berubah.

## Scope pemeriksaan

Clone tidak diubah, tidak memasang dependency, tidak menjalankan build,
dan tidak mengubah source aplikasi. Rencana Home diperbarui ke sumber baru.
Preview lokal lama masih berupa bundle prototipe SVG/CSS; bukan demo upstream.
File TSX/CSS lama sudah digantikan oleh clone, tetapi snapshot tersedia di
`task/home-redesign-2026-10-25/venom-prototype/`.
