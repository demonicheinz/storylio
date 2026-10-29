Method: dual-agent (A: 01a1858e-d975-74e1-a485-82733aa7a77c · B: 01a1858e-daaf-7e62-8956-9b9f2d94b27f)

# Penilaian Dashboard Posts

29 Oktober 2026. Mode Operate. Cakupan: daftar `/dashboard/posts`, editor
tambah/edit, Notes dan penjadwalan. Penilaian dan saran saja; tidak ada perubahan
implementasi, konten CMS, upload, penyimpanan atau publikasi.

## Kesimpulan

Posts sebaiknya mengikuti pola Projects yang sudah disetujui, tanpa mengganti
font, palet atau kemampuan editor. Kebutuhan khususnya adalah Scheduled dan
Note: keduanya perlu dijelaskan sebagai bagian dari pekerjaan menulis, bukan
disembunyikan dalam aturan tanggal/tag. Prioritas pertama adalah kebenaran
status tersimpan dan publikasi, kemudian susunan layar dan konsistensi visual.

## Nilai sementara: 22/40

| Aspek | /4 | Bukti utama |
| --- | ---: | --- |
| Status sistem | 2 | Ada feedback save; jadwal dapat diakui saved tanpa disimpan. |
| Kesesuaian tugas | 2 | Jadwal belum menjelaskan zona waktu dan efek akhirnya. |
| Kontrol pengguna | 2 | Draft baru tidak autosave dan belum memiliki guard keluar. |
| Konsistensi | 2 | Scheduled di daftar menjadi Published di editor. |
| Pencegahan error | 1 | Batch Publish melewati validasi isi editor. |
| Kemudahan mengenali | 2 | Aturan Notes perlu diingat; filter mobile tersembunyi. |
| Efisiensi | 3 | Search, filter, lima sort, list/grid dan batch sudah ada. |
| Kesederhanaan tampilan | 3 | Fondasi tenang; header/editor mendahului identitas. |
| Pemulihan error | 3 | Error manual dan source recovery ada; autosave terlalu generik. |
| Panduan | 2 | Bantuan excerpt/format ada; notes dan publikasi perlu lebih jelas. |

Skor menggabungkan heuristik sumber dan bukti fixture, bukan hasil uji pengguna
atau sertifikasi aksesibilitas. Detector melaporkan `[]` untuk dua markup target
(exit 0, 0 finding/rule/location/false positive). Temuan berikut adalah manual.

## Yang perlu dipertahankan

- Ringkasan ringan dan kemampuan pengelolaan koleksi sudah memadai: search,
  status/tag filter, sort, batch, view switch dan page size.
- Antrean manual-save/autosave mencegah write lama mendahului aksi terbaru;
  saved baseline juga menjaga edit yang dibuat selama request.
- Toolbar lengkap, Source mode, parser safety dan tombol media bersama sudah
  mendapat perbaikan sebelumnya. Jangan mengurangi fitur untuk merapikan layout.
- Manager sudah mengenali exact tag `notes` dan permalink dialog Notes dengan
  benar. Tidak perlu memisahkan tabel atau membuat ulang model data Notes.

## 1. P1 — Save, preview, dan publikasi harus memiliki kontrak yang sama

Draft baru tidak autosave; editor belum memakai guard dirty-navigation yang
sudah tersedia di Projects. Preview memakai slug yang sedang diketik untuk
membuka record tersimpan: create/slug baru bisa 404, sedangkan body dirty bisa
menampilkan versi lama. Publish menjadi tombol utama create lalu berubah pada
edit draft. Batch Publish langsung mengubah status tanpa syarat isi yang
diwajibkan jalur individual.

Saran: Save draft sebagai aksi utama draft; Publish/Schedule sebagai aksi
eksplisit. Gunakan guard draft dan saved-slug preview seperti Projects, beri
label Preview saved, disable sebelum record pertama tersimpan, dan jelaskan
bahwa edit published autosave ke versi live. Terapkan validasi publikasi yang
sama ke seluruh kandidat batch sebelum perubahan apa pun, dengan pesan judul
yang terblokir dan hasil atomik.

Sumber: [editor](../../src/features/dashboard/posts/components/post-editor.tsx#L227),
[autosave](../../src/features/dashboard/posts/components/post-editor.tsx#L286),
[preview](../../src/features/dashboard/posts/components/post-editor.tsx#L387),
[batch action](../../src/features/dashboard/posts/actions.ts#L373).
Tindak lanjut: harden, clarify.

## 2. P1 — Jangan mengakui perubahan jadwal yang tidak tersimpan

Client autosave menganggap semua snapshot form tersimpan dan mereset dirty
baseline. Server autosave sengaja mempertahankan status dan tanggal publikasi.
Akibatnya, perubahan jadwal bisa mendapat “All changes saved” walau storage
masih menyimpan tanggal lama. Ini temuan kontrak sumber, bukan eksperimen pada
database pengguna.

Save draft juga tidak menyimpan tanggal karena draft selalu `publishedAt=null`.
Clear pada tanggal existing kemudian Save changes memakai kembali tanggal lama
melalui fallback server. Editor/preview menyebut Published untuk record yang
masih Scheduled di daftar. Tidak ada bukti future posts bocor lebih awal melalui
reader publik; reader memang memeriksa status dan waktu due.

Saran: pisahkan publication intent dari field yang diautosave, atau rekonsiliasi
baseline hanya dengan field yang benar-benar disimpan. Jadwal harus memiliki
aksi eksplisit dan feedback “Scheduled for …”. Bedakan mempertahankan tanggal,
mengganti tanggal, publish now dan move to draft. Jelaskan date pada draft hanya
diaktifkan saat Schedule, atau simpan intent terpisah jika memang dibutuhkan;
jangan memberi klaim saved pada field yang hilang saat reopen.

Tampilkan tanggal, jam dan zona waktu di dekat aksi. Gunakan classifier display
Draft/Scheduled/Published yang sama di daftar/editor/preview. Status daftar perlu
berubah saat melewati waktu due tanpa menunggu pengguna mengubah filter. Waktu
rilis publik dipengaruhi cache/revalidasi; jangan menjanjikan presisi detik
tanpa strategi invalidasi yang sesuai.

Sumber: [client baseline](../../src/features/dashboard/posts/components/post-editor.tsx#L276),
[server publication fields](../../src/features/dashboard/posts/actions.ts#L297),
[date resolution](../../src/features/dashboard/posts/actions.ts#L68).
Tindak lanjut: harden, clarify.

## 3. P1 — Perbaiki picker tanggal: viewport, keyboard dan informasi tanggal

Pada fixture mobile 390×844, panel kalender terukur top=452, bottom=1012:
bagian bawah melewati viewport 168px. Panel ditempatkan selalu di bawah trigger,
tanpa flip/clamp vertikal. Bulan sebelumnya/berikutnya berupa ikon tanpa nama;
angka tanggal/jam/menit kurang konteks dan selected state hanya visual. Trigger
tidak menghubungkan expanded state/panel, panel tidak memiliki role/name, dan
Escape/focus entry/return belum diatur.

Gunakan pola popover/date-picker aksesibel yang sesuai komponen proyek. Pada
desktop/tablet, flip/collision sesuai ruang tersedia; mobile dapat memakai
drawer tanggal yang seluruh aksinya terjangkau. Beri nama tanggal lengkap,
label hour/minute, state pilihan, timezone, Escape, fokus masuk/kembali dan
viewport-bounded scroll. Radius kontrol mengikuti 8px, panel 12px, bukan pill
32px yang sekarang berbeda dari kontrol sekitarnya.

Sumber: [picker](../../src/features/dashboard/shared/components/date-time-picker.tsx#L118).
Tindak lanjut: adapt, harden.

## 4. P2 — Terapkan komposisi dan presentasi Projects secara konsisten

Daftar: Search/Status/Tags/Sort sejajar 44px, label di atas, Status select, tag
multi-select yang sama di desktop/drawer. Mobile memakai search + dua tombol
ikon, dengan fallback sempit berdasarkan container. Pertahankan status khusus
Scheduled. Judul menjadi link edit pada semua tampilan di luar batch mode;
mobile list sudah punya link dan perlindungan navigasi saat batch.

Header/body list harus memakai track dan padding cell yang sama. Radius grid
card 12px, thumbnail list 16px. Badge solid dengan teks Draft/Published/Scheduled
dan ikon waktu untuk Scheduled; letakkan di body card, bukan menumpuk di foto
terang. Aksi menu di foto juga memerlukan latar solid. Label Note/Article adalah
jenis konten, bukan status publikasi.

Pagination sudah terbukti overflow pada fixture 65 post: documentWidth=444px
pada viewport 390 dan 320. Gunakan mobile Previous / Page X of Y / Next dan
desktop nomor terbatas/ellipsis. Filter aktif/clear, empty-state hasil kosong,
selection di luar page serta judul yang terdampak batch mengikuti Projects.
Reset drawer mengikuti draft/Apply, tidak langsung mengubah filter aktif.

Editor: Title, excerpt, jenis tulisan dan tags sebelum body; setelah itu isi,
cover opsional serta publishing. Header pengantar ikut scroll; hanya save/status
yang sticky. Fixture menunjukkan tinggi sticky 269px pada 390px dan 321px pada
320px. Hindari kolom kanan media yang panjang sementara kiri kosong. Kaitkan
helper/error metadata ke field. Semua fitur toolbar tetap tersedia.

Sumber: [manager](../../src/features/dashboard/posts/components/posts-manager.tsx#L497),
[pagination](../../src/features/dashboard/posts/components/posts-manager.tsx#L798),
[editor layout](../../src/features/dashboard/posts/components/post-editor.tsx#L404).
Tindak lanjut: layout, adapt, polish.

## 5. P2 — Buat alur Note terlihat tanpa mengganti model data

Editor hanya menampilkan Tags generik, sehingga pemilik harus mengingat bahwa
exact tag `notes` mengubah jenis tulisan. Preview private selalu memakai layout
artikel dengan header/TOC, sedangkan Notes publik dibaca dalam dialog.

Saran: pilihan kecil Article / Note atau “Use as a Note” yang hanya menambah/
menghapus tag `notes`, menjaga tag lain. Jelaskan tujuan Home/Notes dan cover
opsional. Jenis konten ditempatkan dekat judul. Gunakan renderer dialog yang
sama untuk preview Notes tersimpan dan lookup private yang tetap terotorisasi;
jangan membuka draft melalui permalink publik. Pertahankan share link
`/blog?tag=notes&note=<slug>` dan Notes sebagai post di database sekarang.

Sumber: [note detection](../../src/features/dashboard/posts/components/posts-manager.tsx#L134),
[generic tag UI](../../src/features/dashboard/posts/components/post-editor.tsx#L673),
[article preview](../../src/app/preview/posts/[slug]/page.tsx#L143).
Tindak lanjut: clarify, harden.

## Beban kerja dan persona

Pemilik memakai ponsel menghadapi header sticky yang mengambil ruang menulis,
Title yang terlambat, pagination overflow dan kalender keluar layar. Pengguna
keyboard memerlukan nama/fokus kalender dan tautan edit konsisten. Pemilik yang
kembali setelah lama perlu bisa membedakan saved, live, scheduled dan Note tanpa
mengingat aturan implementasi. Titik paling melemahkan kepercayaan adalah pesan
saved untuk jadwal yang belum tersimpan; perbaiki sebelum efek visual tambahan.

## Urutan pengerjaan

1. Validasi batch, baseline save jadwal, draft guard, dan preview versi tersimpan.
2. Picker serta status/timezone Scheduled yang konsisten dan dapat diakses.
3. Daftar/editor mengikuti pola Projects, lalu affordance dan preview Notes.

## Bukti dan batas review

Dua assessment sumber independen, lalu sintesis dengan browser. Local app asli
memberi accessibility snapshot daftar Posts; screenshot ekstensi timeout. Fixture
komponen asli dengan font/token proyek, 65 post sintetis dan action tulis
nonaktif dipakai untuk screenshot/geometry. Tidak ada penyimpanan/publikasi,
upload, pengubahan jadwal, atau query database real dalam review ini.

- [Daftar desktop](list-1440.png), [tablet](list-768.png),
  [mobile](list-320.png), [grid](grid-1440.png).
- [Editor desktop](editor-1440.png), [mobile](editor-320.png),
  [kalender mobile](schedule-picker-390.png).
- Daftar 1440/768 tidak overflow; 390/320 melebar menjadi 444px pada data fixture.
- Header sticky editor: 269px/321px pada lebar 390/320, viewport tinggi 900px.
- Kalender 390×844: 560px tinggi, bottom=1012px.

Tidak ada overlay detector yang diinjeksi ke aplikasi pengguna. Native browser
evaluate bersifat read-only; yang dipakai adalah evidence fixture terisolasi.
Temuan perilaku save/publication adalah bukti sumber, belum klaim E2E produksi.
Tidak menjalankan build/test suite karena review tidak mengubah implementasi.

Questions skipped: sasaran review sudah jelas; tidak diperlukan keputusan baru
sebelum penilaian ini disampaikan.

## Evaluasi hasil review

| Aspek | Nilai | Bukti / batas |
| --- | --- | --- |
| Akurasi | 4/5 | Kontrak source dan geometry browser; jadwal tidak diuji melalui write real. |
| Kelengkapan | 4/5 | List/editor/notes/schedule dinilai; fixture bukan autentikasi E2E. |
| Kejelasan | 4/5 | Lima prioritas memisahkan masalah simpan dan komposisi; schedule membutuhkan rincian. |
| Dapat ditindaklanjuti | 5/5 | Arah konkret, source links dan screenshot tersedia. |
| Keringkasan | 4/5 | Temuan teknis schedule dikelompokkan, evidence lengkap tetap di arsip. |

Rata-rata 4.2/5. Langkah verifikasi berikutnya pada implementasi adalah tes
round-trip jadwal, batch publication atomik, picker keyboard dan saved-note preview.
