# Referensi Home dari stash

Dicatat pada 25 Oktober 2026 atas permintaan pengguna. Referensi ini belum
diterapkan kembali ke branch aktif. `DESIGN.md` di root tetap memakai tema Planet
terbaru; `original-DESIGN.md` di folder ini adalah arsip referensi Framer lama,
bukan pengganti keputusan token, font, logo, atau avatar terbaru.

## Stash yang disimpan

- Hasil resolusi: `04d3b4dce724f5152666480ba417d61aeed0beb0`.
  Nama: `reference/home-design-2026-10-24-resolved-on-36f8b3b`.
  Saat dicatat berada di `stash@{0}`, berbasis HEAD `36f8b3b`.
- Stash asli tetap ada: `6b1feaff0870fb34cccf5f2e84d5c1119e2cdc0c`,
  saat dicatat berada di `stash@{1}`. Berasal dari branch `style/ui-polish`
  sebelum pembersihan history dan perbaikan cache/navbar terbaru.
- Nomor stash bisa berubah. Gunakan hash/nama untuk identifikasi. Untuk melihat
  sebuah file tanpa menerapkan stash:

```powershell
git show '04d3b4dce724f5152666480ba417d61aeed0beb0:src/components/public/sections/home/hero.tsx'
```

Jika nanti ingin mengerjakannya lagi, periksa working tree dahulu dan gunakan
stash hasil resolusi. `git stash apply` mempertahankan salinan stash; jangan
otomatis melakukan pop/drop. Terapkan di atas state branch saat itu dengan
review baru karena branch mungkin sudah berubah.

## Home yang pernah diterapkan

Sumber: `home-plan.md`, `home-implementation.md`, dan screenshot
`home-hero-1440.png` / `home-hero-390.png`. Ini bukti historis dari dev pada
24 Oktober, bukan bukti UI aktif atau deployment terbaru.

- Hero astronaut/planet memakai `/images/home-hero.avif`, judul terpusat
  “Interfaces. Experiments. Personal work.”, font tetap Clash Display/Satoshi/
  JetBrains Mono. Heading maksimum 72px; crop gambar diturunkan.
- CTA utama ke About, ukuran compact sekitar 46px, avatar 24px dan panah 16px.
  Dalam resolusi, avatar mengikuti `ProfileAvatar` terbaru; fallback foto
  `/images/heinz.jpg` tidak dipulihkan.
- Navbar Gooey mengambang di tengah, hide saat scroll turun/reveal saat naik.
  Resolusi mempertahankan engine, aksesibilitas, active route, dan reduced
  motion terbaru dari `FloatingNav`; versi navbar lama tidak menggantikannya.
- Grid maksimal tiga proyek dan tiga tulisan; tiga kolom desktop, dua tablet,
  satu mobile, container 1280px, gap 24px.
- Kartu referensi memakai radius luar 16px, gambar 8px, inset 8px dan border
  halus. Angka ini mencatat desain lama dan belum menetapkan ulang radius
  tema terbaru atau preferensi ukuran pengguna.
- Approach menampilkan judul/deskripsi sebelum hover, sekitar 280px desktop
  dan auto-height mobile. Efek canvas hover/focus/tap tetap ada.
- Testimonial mempertahankan infinite cards. Footer berisi social links,
  wordmark Heinz besar, divider dan copyright.
- Desain lama memakai canvas hitam dan surface netral khusus Home di
  `src/app/home.css`. Ini tetap referensi terpisah dari token biru/navy Planet
  saat ini; penggabungan visual selanjutnya perlu mengikuti arahan pengguna.

## Konsep pembanding, terpisah dari Home planet

Stash juga memuat `/design-preview` dengan empat konsep. Source berada di
`src/components/concepts/` di dalam stash; screenshot dan catatan lengkap berada
di `task/landing-lab-2026-10-24/` di dalam stash.

| Konsep | Komposisi |
| --- | --- |
| A / Frame | Intro tengah, garis struktur, tiga kolom karya, proses berurutan, journal expandable. |
| B / Studio | Hero editorial terbelah, project rows dan brief, process accordion. |
| C / Playground | Pemilih karya, previous/next, study selector, Base UI process tabs. |
| D / Blueprint | Bingkai lebar, garis/crosshair, aksen biru #78b9ff, label //, kipas cover, judul berputar dengan pause. |

Blueprint adalah tambahan setelah preferensi terhadap Frame, bukan bukti bahwa
pengguna sudah mengganti Home planet dengan Blueprint. Baca `concepts.md` dan
`blueprint.md`; gambar `blueprint-1440.png` dan `blueprint-390.png` disalin dari
stash untuk mengingat tampilannya. Konten konsep adalah sample/reference cover,
bukan proyek/klien baru milik pengguna.

## Resolusi dan verifikasi

10 file konflik sudah diselesaikan. Enam public route mempertahankan boundary
cache terbaru karena perubahan stash hanya mengulang wrapper Suspense lama.
Home menggabungkan layout stash dengan cache tags terbaru; GooeyNav dan root
DESIGN memakai versi terbaru. Layout publik/preview mendukung footer terpisah
tanpa mengganti navbar terbaru. Proteksi Proxy 404 tetap ada.

Sebelum disimpan kembali: typecheck lulus, 116 tes pada 15 file lulus, lint
pada empat file resolusi lulus, dan diff check lulus. Tidak menjalankan build
atau browser untuk menyatakan desain gabungan siap produksi; tujuan turn ini
adalah resolusi konflik dan penyimpanan referensi. Stash hasil resolusi tidak
memiliki konflik index. Setelah stash, tracked working tree kembali sama dengan
HEAD. Hanya folder catatan ini yang sengaja dibiarkan untracked agar mudah dibaca.

Backup keadaan awal konflik ada di ignored
`.tmp/stash-recovery-2026-10-25/snapshot/`, termasuk salinan index dan kedua sisi
konflik. `source-map.json` memetakan file referensi ke sumber asli; delapan file
non-DESIGN juga diverifikasi identik dalam stash hasil resolusi. Tidak membuat
commit, push, atau menghapus stash asli.

Self-review: accuracy 4/5 (hash dan bytes diverifikasi; tanpa browser gabungan),
completeness 5/5 (konflik, stash ulang dan referensi tersimpan), clarity 4/5
(arsip dan tema aktif dibedakan; banyak artefak historis), actionability 5/5
(hash, source, screenshot dan langkah inspeksi tersedia), conciseness 4/5
(detail di catatan ini). Rata-rata 4.4/5. Perbaikan berikutnya: review visual
ulang hanya ketika pengguna meminta desain stash diterapkan.
