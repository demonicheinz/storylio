# Migrasi Prisma ke Drizzle

Tanggal: 21 Oktober 2026 (Asia/Bangkok).
Baseline repo: 79802c0; dikerjakan setelah migrasi Infisical.

## Implementasi

- Drizzle ORM 0.45.4, Drizzle Kit 0.31.11, dan driver Neon WebSocket.
- Schema untuk 19 model dan satu junction table mempertahankan bentuk fisik
  PostgreSQL. Enum bersama berada di src/lib/db/enums.ts.
- Semua query/mutasi aplikasi, adapter auth, API, seed, dan backfill telah
  dipindahkan ke operasi Drizzle native. Tidak ada Prisma compatibility DSL.
- Direct dependencies Prisma dan postinstall generate dihapus. Prisma adapter
  vendor dapat tetap ada sebagai paket opsional bawaan Better Auth; aplikasi
  memakai adapter Drizzle.
- SQL/schema historis diarsipkan di db/legacy-prisma. Implementasi seed pindah
  ke scripts/seeds dengan konten tetap.
- ID lama dipertahankan; insert aplikasi baru memakai CUID2 pada kolom text.
- Relasi tag eksplisit, screenshot replacement, reorder, About singleton,
  dan view/event writes menggunakan transaksi yang diuji.
- Nullable SQL arrays dipertahankan dan dinormalisasi pada kontrak UI.
- esbuild dipatok ke versi patched yang dipakai toolchain untuk menutup
  advisory dari helper lama Drizzle Kit.
- CLI baru memiliki status, migration, dan baseline check/adoption. Pending
  ledger/history yang tidak cocok ditolak. Unknown CLI flags ditolak sebelum
  koneksi agar opsi seperti --dry-run tidak diam-diam menjalankan migration.
- Automatic reset lama dipensiunkan dengan pesan eksplisit. Schema generation
  tidak memerlukan secrets; database commands tetap memakai Infisical.

## Verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Frozen install normal | Lolos; tanpa Prisma generate. |
| SQL generate ulang | Tidak ada perubahan schema. |
| Drizzle migration check | Lolos. |
| Vitest | 47 test pada 9 file lolos. |
| Playwright CLI | 6 browser smoke checks lolos. |
| Typecheck | Lolos. |
| Biome | Lolos; 253 file. |
| Build akhir | Lolos; 35/35 halaman statis. |
| Prisma vs Drizzle live read parity | Semua 19 model di dev cocok per count/field. |
| Live baseline dev | 20 tabel dan metadata cocok; read-only. |
| Live baseline staging | 20 tabel dan metadata cocok; read-only. |
| Live baseline prod | 20 tabel dan metadata cocok; read-only. |
| Dependency audit | Tetap 1 advisory high braces; tidak ada advisory tambahan. |
| Diff whitespace | Lolos. |
| Pemeriksaan sub-agent | Tidak ada temuan blocking pada baseline tooling/schema. |

Test PostgreSQL lokal memakai PGlite yang memuat tiga SQL migration historis.
Cakupan meliputi transaksi tag/screenshot/order, media references, singleton
About, seed idempotence, atomic view tracking, scheduled-post visibility,
relational tag ordering, existing CUIDs, runtime defaults, cascades, schema drift,
history corruption, metadata-only adoption, dan bootstrap database kosong.

Adapter auth diuji dengan hash credential yang telah tersimpan, sesi lama,
login/cookie signed-session, dan material/counter passkey. Full WebAuthn
ceremony dan GitHub OAuth dengan provider nyata belum diuji; browser smoke
menggunakan fixture challenge sesuai kontrak repo.

Rows dan credentials live parity tinggal di memori; hanya nama model, count,
kesetaraan, dan nama field yang berbeda yang dicetak. Tidak ada data rows yang
diekspor ke laporan. Tidak ada nilai secret yang ditulis.

## Status eksternal

Dengan persetujuan pengguna, baseline ledger dev, staging, dan prod telah
diadopsi pada 21 Oktober 2026, pukul 22:36–22:38 (Asia/Bangkok). Status ketiganya
setelah adopsi: applied 1, pending 0, requiresBaseline false. Adopsi hanya menulis
schema/table/record metadata Drizzle dalam transaksi; tabel dan data aplikasi
tidak diubah. Tidak ada seed, reset, backfill, push atau deploy yang dijalankan.
Browser/server testing telah ditutup.

Bukti tanpa credentials: [hasil adopsi](evidence/drizzle-baseline-adoption-2026-10-21.json).
Laporan disimpan di `task/maintenance-2026-10-21/`; helper sementara di `.tmp/`
yang diabaikan Git dan dikecualikan dari TypeScript.

Panduan operasional dan rollback: [Drizzle migration](../../docs/DRIZZLE_MIGRATION.md).
Perubahan belum di-commit oleh agen.

## Evaluasi mandiri

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Parity 19 model, catalog 3 env, PGlite auth/mutations, dan build lolos; auth provider/hardware nyata belum diuji. |
| Kelengkapan | 4/5 | Query, auth, seed, tooling, archive, tests dan ledger ketiga environment selesai; full OAuth/WebAuthn tetap perlu preview khusus. |
| Kejelasan | 4/5 | README/AGENTS konsisten dengan Drizzle; guide memisahkan empty-db bootstrap dan existing-db adoption. |
| Dapat ditindaklanjuti | 4/5 | Semua ledger terverifikasi tanpa pending migration dan panduan operasional tersedia; commit/deploy masih langkah terpisah. |
| Keringkasan | 4/5 | Detail bukti tersimpan di laporan/guide; ringkasan chat berfokus hasil dan langkah berikutnya. |

Rata-rata 4,0/5. Berikutnya: verifikasi auth lengkap di preview, lalu review dan
commit/deploy terpisah. Prioritas perbaikan: jalankan OAuth/WebAuthn dengan provider
nyata di preview; pertahankan index task sebagai sumber status agar laporan lama
tidak terbaca sebagai status terbaru. Penilaian ini sesuai hasil yang dapat
ditinjau pengguna, dengan batas auth nyata disebutkan secara eksplisit.
