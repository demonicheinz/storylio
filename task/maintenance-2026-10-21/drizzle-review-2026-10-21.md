# Tindak lanjut review migrasi Drizzle

## Upload

`src/app/api/upload/route.ts` sekarang memeriksa hasil `.returning()` sebelum
mengakses field media atau memanggil revalidasi. Hasil kosong masuk ke jalur
error 500 yang sudah ada. `noUncheckedIndexedAccess` tidak aktif pada tsconfig
saat review; guard tetap ditambahkan agar invariant hasil insert eksplisit.

## Timestamp

`src/lib/db/schema.ts` sudah memakai helper `updatedAt()` dengan `$defaultFn`
dan `$onUpdate(() => new Date())`. Post, Project, ProjectScreenshot, serta semua
kolom non-null `updatedAt` lain memakai helper tersebut; Verification memiliki
hook yang sama pada kolom nullable. GalleryItem, Media, Testimonial dan HomeSection
tidak memiliki kolom `updatedAt` dalam schema Prisma historis maupun Drizzle.
Tidak ada kolom atau SQL default baru yang diperlukan.

Tes schema diperluas untuk menguji edit Post serta bulk publish/draft tanpa
timestamp eksplisit. Tes User sebelumnya juga menguji pembaruan timestamp.

## Seed

`git show HEAD:prisma/seeds/posts.ts` mengonfirmasi bahwa blok `update` pada
upsert Prisma lama menulis title, excerpt, content, coverImage, status,
publishedAt, viewCount, authorId dan mengganti relasi tag. Perilaku Drizzle
dipertahankan. Tes baru memastikan edit konten dan viewCount kembali ke sampel
setelah re-seed, sementara ID dan createdAt tetap. Panduan operasional sekarang
menjelaskan konsekuensi re-seed ini.

## Jumlah advisory

Komentar jumlah advisory yang sama diterima dua kali dan ditinjau sekali.
Penghitungan ulang snapshot `evidence/maintenance-advisories-2026-10-21.json`
yang tersedia saat review menghasilkan 25 package, **85 entri dan 85 ID unik**:
4 critical, 38 high, 39 moderate dan 4 low. Angka dalam audit awal serta
`security-verification-2026-10-21.json.before` sudah sesuai dengan snapshot ini.
Tidak ada advisory yang ditambahkan atau dihapus untuk menyesuaikan laporan.

Perintah hitung ulang, dijalankan dari root repo:

```powershell
bun -e 'const a=await Bun.file("task/maintenance-2026-10-21/evidence/maintenance-advisories-2026-10-21.json").json(); const rows=Object.values(a.packages).flat(); const severity={}; for(const row of rows) severity[row.severity]=(severity[row.severity]??0)+1; console.log(JSON.stringify({packages:Object.keys(a.packages).length,advisories:rows.length,uniqueIDs:new Set(rows.map(row=>row.id)).size,severity}));'
```

Raw output awal `bun audit --json` tidak ditemukan di artefak lokal; bukti yang
bisa dihitung ulang adalah snapshot tersimpan tersebut. Audit dependency terkini
tidak digunakan untuk merekonstruksi jumlah historis.

## Pengurutan dan flatten tag bersama

Ketujuh query di enam halaman dashboard, blog, home dan preview sekarang memakai
`orderPostTagsByName` dari `src/lib/db/query-utils.ts`. Helper memakai PostgreSQL
`QueryBuilder` mandiri sehingga tidak mengimpor koneksi Neon. Correlated subquery
dan urutan ascending nama tetap sama.

Semua flatten relasi tag pada halaman tersebut memakai `flattenPostTags`.
Tipe hasil mengikuti proyeksi query, termasuk `{ name }` tanpa menambahkan
field `id` yang tidak dipilih. Tes PGlite menguji pengurutan tag lengkap serta
proyeksi nama dan hasil flatten; typecheck dan lint lolos. Perubahan tidak
memerlukan migrasi schema atau akses database eksternal.

## Verifikasi dan evaluasi

`bun run test`: 49 tes pada 9 file lolos. `bun run typecheck`, `bun run lint`
(256 file) dan `git diff --check` lolos. Build dan browser smoke tidak diulang:
perubahan runtime mencakup guard hasil insert dan pemusatan query tag yang
diverifikasi dengan PGlite serta typecheck; hasil build/browser sebelumnya
tetap tercatat di laporan migrasi. Tidak ada database eksternal yang diubah.

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Hook timestamp, seeder historis dan jumlah JSON diperiksa; raw audit awal tidak tersedia. |
| Kelengkapan | 4/5 | Empat temuan unik ditanggapi; guard upload belum memiliki tes khusus hasil insert kosong. |
| Kejelasan | 4/5 | Kesimpulan setiap temuan dan perintah recount tersedia; konteks migrasi tetap di laporan terpisah. |
| Dapat ditindaklanjuti | 4/5 | Guard diperbaiki, 49 tes dan pemeriksaan statis lolos; review/commit masih dilakukan pengguna. |
| Keringkasan | 4/5 | Bukti rinci dipusatkan di catatan ini; index task cukup menautkannya. |

Rata-rata 4,0/5. Perbaikan lanjutan yang paling berguna: simpan raw audit pada
pemindaian berikutnya dan perluas pengujian upload bila alur penyimpanannya
diubah lagi. Pengguna dapat memeriksa kesimpulan dari file dan perintah di atas;
keterbatasan bukti historis disebutkan tanpa merekonstruksi data yang hilang.
