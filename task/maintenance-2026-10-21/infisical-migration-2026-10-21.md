# Migrasi lokal dotenvx ke Infisical Cloud

Tanggal: 21 Oktober 2026 (Asia/Bangkok). Baseline sebelumnya: commit
`8b2cfcc`, perbaikan keamanan dependency dan setup testing.

## Hasil lokal

- Sebanyak 29 wrapper script kini menggunakan `infisical sm run`, path root,
  dan environment eksplisit: default → dev, :preview → staging,
  :production → prod.
- Ketiga environment dapat dibaca melalui CLI 0.44.3 yang sudah dipasang
  pengguna. Seluruh nama variabel lama tersedia: dev 24, staging 24, prod 22.
  Tidak ada nilai secret yang ditampilkan oleh pemeriksaan kelengkapan.
- File lama diarsipkan tanpa menghapus isinya ke
  `.env.local.pre-infisical`, `.env.preview.pre-infisical`, dan
  `.env.production.pre-infisical`. Semuanya tetap diabaikan Git. Ini
  mencegah Bun/Next memakai file lama sebagai fallback.
- Dependency dotenvx langsung dihapus; shadcn masih memilikinya secara
  transitif di lockfile. Tidak ada script aplikasi/DB yang memanggil dotenvx.
- Prisma config memakai `process.env.DIRECT_URL` agar postinstall generate
  tidak memerlukan kredensial. Migration tetap memakai DIRECT_URL saat
  dijalankan melalui wrapper environment yang sesuai.
- `build:hosted` menyediakan build dari env yang sudah diinjeksi CI/Vercel.
- Konfigurasi Infisical milik pengguna tetap menjadi sumber project metadata.
  Perubahan awal pengguna pada VS Code tidak disentuh.

## CI dan Vercel

Sesuai pilihan pengguna, baru konfigurasi dan panduan yang disiapkan. Machine
identity, repository variables, dan integrasi Vercel belum diubah.

Workflow Quality Checks menyiapkan OIDC untuk push main setelah repository
variable INFISICAL_IDENTITY_ID diisi. Dibutuhkan juga INFISICAL_PROJECT_ID;
domain Cloud US menjadi default dan dapat dioverride dengan INFISICAL_DOMAIN.
Action dipatok pada SHA release v1.0.18. Hanya DATABASE_URL dari staging
yang diimpor. Auth CI tetap menggunakan fixture dummy.

Sebelum identity tersedia, dan untuk pull request, build mempertahankan
GitHub DATABASE_URL secret yang sudah digunakan. OIDC tidak dibuka ke PR.
Guide mengharuskan issuer/audience/subject dibatasi ke repo dan main.

Vercel perlu sinkronisasi dev→Development, staging→Preview, prod→Production
dan Build Command `bun run build:hosted`. Default build lokal memakai dev
serta login CLI, sehingga tidak cocok sebagai command build Vercel.

Panduan lengkap: `docs/INFISICAL_SETUP.md`.

## Bukti verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Kelengkapan nama variabel Cloud | Semua 24/24/22 nama tersedia. |
| Pemetaan script | Semua 29 wrapper memakai environment yang diharapkan. |
| Prisma generate tanpa file env | Lolos. |
| Frozen install beserta Prisma postinstall | Lolos, tanpa perubahan dependency. |
| Build memakai Infisical dev | Lolos, 35/35 halaman statis. |
| Status migration dev | 3 migration, up to date. |
| Status migration staging | 3 migration, up to date pada verifikasi akhir. |
| Query baca staging | SELECT 1 berhasil. |
| Vitest | 8 test lolos pada 2 file. |
| Lint | Lolos, 236 file. |
| Typecheck | Lolos setelah regenerasi route types dengan next typegen. |
| YAML workflow | Berhasil diparse dan konfigurasi staging/OIDC diverifikasi. |
| Audit dependency | Tetap 1 advisory high braces, tanpa temuan baru. |
| Diff whitespace | Lolos. |

Status staging sempat gagal pada schema engine. URL dari Infisical terbukti
sama dengan backup; query baca berhasil dan status akhirnya up to date.
Penyebab kegagalan awal belum dipastikan. Tidak ada migration, seed, reset,
atau backfill yang dijalankan.

Regenerasi tipe memperbaiki referensi lokal ke file .next/dev/types yang sudah
tidak tersedia; konfigurasi TypeScript proyek tidak diubah.

Akses produksi hanya diperiksa untuk kelengkapan nama variabel. Tidak ada
pemeriksaan migration prod, build prod, atau deployment yang dijalankan.

## Pemeriksaan mutu

| Aspek | Skor | Bukti/batas |
| --- | --- | --- |
| Akurasi | 4/5 | Pemetaan dan checks lokal terbukti; CI OIDC/Vercel belum diuji eksternal. |
| Kelengkapan | 4/5 | Local scripts, install, rollback backup, CI draft, dan guide tercakup; aktivasi layanan menunggu pengguna. |
| Kejelasan | 4/5 | README dan guide membedakan local/hosted build serta environment slugs; detail operasi disimpan di guide. |
| Dapat ditindaklanjuti | 4/5 | Script siap dipakai, panduan memuat identity/repo vars/sync; resource eksternal belum diprovisi. |
| Keringkasan | 4/5 | Bukti ringkas ditabelkan; secret values dan log database tidak disalin. |

Rata-rata 4,0/5. Perbaikan berikutnya: aktifkan OIDC dan sync Vercel,
verifikasi Preview, lalu lanjutkan rencana migrasi ORM setelah review.
