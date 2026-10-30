Method: dual-agent (A: 01a18339-38a8-7972-9c69-8ce14096364e · B: 01a18339-39f6-7311-aafd-7360c2d9d046)

# Penilaian Dashboard Projects

28 Oktober 2026. Cakupan: daftar `/dashboard/projects` serta editor tambah/edit.
Mode Operate; penilaian dan saran saja. Tidak ada perubahan implementasi, CMS,
upload, publikasi, atau operasi database dalam review ini.

## Kesimpulan

Fondasi visual sesuai Storylio: navy, aksen biru, font proyek, ringkasan angka
yang ringan, dan komponen dashboard bersama. Perbaikan terbesar adalah hubungan
antara mencari proyek, membuka editor, menyimpan, preview, dan publikasi.
Pertahankan gaya visual dan seluruh kemampuan editor; rapikan susunan dan
aksesnya. Jangan menghilangkan fitur toolbar untuk mengatasi kepadatan.

## Skor heuristik

Skala 0–4, semakin tinggi semakin baik. Skor sementara **21/40**; bukan hasil
uji pengguna atau sertifikasi aksesibilitas.

| Aspek | Skor | Temuan utama |
| --- | ---: | --- |
| Status sistem | 2 | Ada status save; versi yang dibuka Preview kurang jelas. |
| Kesesuaian tugas | 2 | Case study mendahului identitas proyek pada mobile. |
| Kontrol pengguna | 2 | Dirty state belum dilindungi saat keluar/reload. |
| Konsistensi | 2 | Publikasi individual dan batch berbeda validasi. |
| Pencegahan kesalahan | 2 | Preview aktif sebelum record pertama tersimpan. |
| Kemudahan mengenali aksi | 2 | Judul proyek belum menjadi tautan edit. |
| Efisiensi | 3 | Search, shortcut, batch, list/grid, dan reorder tersedia. |
| Kesederhanaan tampilan | 2 | Toolbar dan header sticky menyita ruang kerja. |
| Pemulihan error | 2 | Feedback ada; error autosave kurang menunjukkan tindakan perbaikan. |
| Panduan | 2 | Bantuan field ada; efek autosave pada proyek live perlu lebih dekat ke aksi. |

## Yang sudah baik

- Ringkasan jumlah proyek memakai definition list, tanpa kartu statistik besar.
- Search, filter, tampilan list/grid, pagination dan reorder memberi kemampuan
  pengelolaan yang nyata. Reorder sudah meminta seluruh koleksi tanpa filter.
- Status draft/published eksplisit. Save manual menunggu autosave terdahulu dan
  menjaga edit yang dibuat selama request. Pertahankan kontrak ini.

## Prioritas

### 1. P1 — Satukan kontrak save, preview, dan publikasi

Editor tidak memiliki perlindungan keluar/reload saat dirty. Create tidak
autosave; edit autosave setiap 30 detik. Autosave untuk proyek published menulis
langsung ke versi live. Preview membuka record tersimpan berdasarkan slug,
bukan isi form terbaru; proyek baru atau slug baru dapat membuka not-found.

Batch Publish mengubah status tanpa pemeriksaan isi yang diwajibkan editor.
Draft dengan case study kosong bisa lolos lewat batch, walaupun Publish dari
editor menolaknya. Ini bukti kode, bukan publikasi yang dilakukan saat review.

Saran: guard perubahan belum tersimpan; validasi publikasi sama untuk setiap
jalur; beri nama jelas pada preview versi tersimpan. Untuk draft baru, simpan
draft sebelum preview. Untuk published, jelaskan bahwa save/autosave mengubah
halaman live; jangan menyiratkan private revision yang belum ada.

Sumber: [save/preview](../../src/features/dashboard/projects/components/project-editor.tsx#L325),
[batch publish](../../src/features/dashboard/projects/actions.ts#L424).
Tindak lanjut: harden, clarify.

### 2. P1 — Samakan akses dan pending state upload screenshots

Drop zone screenshots menggunakan div dengan handler keyboard, tetapi tanpa
fokus keyboard. Input file disembunyikan. Drop juga masuk ke upload tanpa
memeriksa disabled/in-flight di entry point. Jangan menganggap keyboard handler
saja membuat sebuah div dapat dijangkau dengan Tab.

Gunakan native button yang bernama; cegah browser default drop dan periksa
disabled/in-flight secara sinkron untuk semua jalur. Hubungkan label caption
dan alt text ke input masing-masing. Tidak perlu mengganti komponen upload.

Sumber: [screenshots upload](../../src/features/dashboard/projects/components/screenshots-upload.tsx#L50),
[drop zone](../../src/features/dashboard/projects/components/screenshots-upload.tsx#L226).
Tindak lanjut: harden.

### 3. P2 — Dahulukan identitas dan ringkas area sticky editor

Di desktop, panel metadata/media memanjang jauh di kolom kanan sementara kiri
kosong di bawah editor. Di mobile, seluruh editor mendahului Title. Header
sticky pada fixture 360px terukur 269px, belum termasuk offset shell 56px.

Susunan yang disarankan: Title → ringkasan/contribution → case study → media →
links/stack. Publication/status bisa menjadi panel pendamping ringkas di desktop.
Letakkan media pada area lebih lebar; thumbnail override, OG image, slug dan
manual order boleh menjadi pengaturan tambahan yang tetap mudah ditemukan.
Saat scroll, hanya status/aksi simpan yang tetap sticky; judul/deskripsi ikut
scroll. Hindari wizard wajib. Pertahankan seluruh kemampuan MDX.

Sumber: [struktur editor](../../src/features/dashboard/projects/components/project-editor.tsx#L443).
Tindak lanjut: layout, adapt.

### 4. P2 — Jadikan judul pintu masuk edit dan hapus gutter pasif

Judul dan thumbnail bukan link edit; pengguna harus membuka menu titik tiga.
Gutter drag 44px tetap tampil di list normal walaupun tidak dapat dipakai.
Pada 320px, gutter dan menu mempersempit judul serta membuat baris tinggi.
Header daftar juga menempatkan New Project di samping teks yang akhirnya wrap
menjadi banyak baris.

Gunakan link judul untuk edit satu langkah. Dalam batch mode, judul menjadi
teks/target seleksi tanpa navigasi. Tampilkan drag handle hanya saat Reorder;
checkbox hanya saat Select. Letakkan New Project di bawah pembuka pada mobile.
Pindahkan updated date dan badge ke metadata bawah; jangan menambah kolom kecil.

Sumber: [baris proyek](../../src/features/dashboard/projects/components/projects-manager.tsx#L501),
[header](../../src/features/dashboard/projects/components/projects-manager.tsx#L1391).
Tindak lanjut: layout, adapt.

### 5. P2 — Tunjukkan filter aktif dan scope pilihan; batasi pagination

Drawer mobile menyembunyikan status filter setelah ditutup. Teknologi memakai
button berwarna tanpa pressed/checked state. Selected IDs tetap ada lintas
filter/page; total pilihan belum menjelaskan item di luar tampilan. Zero result
belum dibedakan tegas dari koleksi kosong. Pagination merender semua nomor.

Tampilkan `Filters (n)`, jumlah hasil dan Clear filters. Sediakan Select page dan
indikasi pilihan di luar view; review judul sebelum batch delete. Samakan Reset
dengan pola draft/Apply drawer. Pakai Previous / Page X of Y / Next di mobile,
dan rentang nomor dengan ellipsis di desktop. Risiko pagination bergantung
jumlah halaman; fixture lima proyek belum memperlihatkan overflow tersebut.

Sumber: [selection](../../src/features/dashboard/projects/components/projects-manager.tsx#L1308),
[pagination](../../src/features/dashboard/projects/components/projects-manager.tsx#L825),
[mobile filters](../../src/features/dashboard/projects/components/projects-manager.tsx#L1669).
Tindak lanjut: clarify, harden, adapt.

## Dampak pada pengguna

- Pemilik memakai ponsel: header dan gutter mengurangi ruang isi; lebih sulit
  mengenali nama proyek dan menemukan field pertama untuk membuat proyek.
- Pemilik kembali setelah lama: Preview dan Save perlu menjelaskan versi dan
  efek publiknya tanpa mengingat aturan autosave 30 detik.
- Pengguna keyboard: perlu tautan edit langsung, upload screenshots yang dapat
  difokuskan, dan state teknologi yang diumumkan.

## Observasi kecil

Samakan badge Published dengan token `success` seperti editor; manager masih
memakai emerald hardcoded. Placeholder editor proyek masih menyebut post.
Nama menu Preview daftar lebih tepat View live karena menuju halaman publik.
Hubungkan help/error metadata ke input dengan aria-describedby. Shortcut Ctrl/K
di Windows sebaiknya tidak ditampilkan sebagai simbol Cmd di semua perangkat.

## Bukti dan batas

Dua assessment sumber independen diselesaikan sebelum sintesis. Detector
menghasilkan `[]` pada kedua markup target (0 finding, 0 false positive);
ini tidak memverifikasi kontrak interaksi. Browser lokal asli memberi snapshot
daftar Projects; screenshot ekstensi timeout. Screenshot berikut memakai
komponen asli, token/font proyek, data fixture, dan action mutasi nonaktif:

- [Daftar desktop](list-1440.png), [tablet](list-768.png),
  [360px](list-360.png), [320px](list-320.png).
- [Grid desktop](grid-1440.png), [filter mobile](filters-360.png).
- [Editor desktop](editor-1440.png), [editor mobile](editor-360.png).

Tidak ada overflow horizontal pada daftar fixture 1440/768/360/320 atau editor
1440/360. Ini bukan bukti bahwa pagination besar atau setiap state form aman.
Browser fixture tidak menyimulasikan routing/history Next secara penuh, tidak
menguji upload/publikasi sungguhan, dan tidak mensertifikasi contrast/WCAG.

## Urutan implementasi yang disarankan

1. Lindungi draft dan samakan validasi batch publish, preview serta pending upload.
2. Poles daftar, header mobile, direct edit, filter/selection dan pagination.
3. Susun ulang editor serta media, lalu verifikasi desktop/tablet/mobile,
   keyboard, long data, autosave, preview, dan error recovery.

Questions skipped: ruang lingkup cukup jelas untuk penilaian; keputusan
implementasi tetap menunggu instruksi pengguna.
