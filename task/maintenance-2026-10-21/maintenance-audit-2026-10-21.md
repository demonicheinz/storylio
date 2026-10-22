# Audit maintenance dan rencana migrasi Storylio

Tanggal: 21 Oktober 2026, Asia/Bangkok.
Snapshot kode: commit `5a6b2f3`. Ruang lingkup: audit dan rencana, sesuai pilihan pengguna.

Status lanjutan pada 21 Oktober 2026: perbaikan dependency keamanan dan setup Vitest/Playwright CLI sudah diterapkan secara lokal. Lihat `security-maintenance-2026-10-21.md` untuk hasil dan batas verifikasi. Angka di bawah tetap merupakan snapshot audit awal.

Tahap Infisical: pengguna sudah mengisi dev/staging/prod. Migrasi script lokal dan verifikasi selesai; OIDC CI serta Vercel masih berupa konfigurasi/panduan yang menunggu aktivasi pengguna. Lihat `infisical-migration-2026-10-21.md`.

Tahap Drizzle: implementasi lokal selesai dengan 47 test dan 6 browser checks lolos. Read parity 19 model dev serta baseline metadata 20 tabel di dev/staging/prod cocok. Adopsi ledger ketiga environment selesai dengan izin pengguna; status masing-masing applied 1, pending 0, requiresBaseline false. Lihat `drizzle-migration-2026-10-21.md` dan `../../docs/DRIZZLE_MIGRATION.md`.

Rekomendasi: kerjakan perbaikan keamanan terlebih dahulu, kemudian migrasi dotenvx ke Infisical, lalu Prisma ke Drizzle. Pisahkan perubahan framework, secrets, dan ORM agar penyebab regresi serta rollback dapat ditelusuri. Belum ada bukti bahwa penggantian ORM akan mempercepat aplikasi ini; manfaat performa harus diukur.

## Bukti dan batas audit

| Pemeriksaan | Hasil |
| --- | --- |
| `bun run lint` | Lolos; 231 file diperiksa, tanpa perbaikan otomatis. |
| `bun run typecheck` | Lolos. |
| `bun outdated` | Berhasil setelah akses registry di luar sandbox; hasil lengkap di `evidence/maintenance-outdated-2026-10-21.txt`. |
| `bun audit --json` | 85 entri advisory pada 25 nama package: 4 critical, 38 high, 39 moderate, 4 low. Data di `evidence/maintenance-advisories-2026-10-21.json`. |
| Test otomatis | Tidak ditemukan konfigurasi runner atau suite test yang dilacak Git; nama `testimonials.ts` adalah seed, bukan test. Ada direktori artefak Playwright lokal, tetapi itu bukan bukti suite regresi saat ini. |
| Build dan pengujian runtime | Belum dijalankan dalam audit ini. Build perlu diverifikasi dengan database/environment preview yang jelas. |
| Database dan deployment | Tidak diakses untuk audit; kondisi schema aktual, migration ledger, isi secret, dan konfigurasi Vercel belum diverifikasi. |

Jumlah advisory adalah hasil pencocokan dependency, bukan jumlah celah yang sudah terbukti dapat dieksploitasi pada Storylio. Satu package dapat memiliki banyak advisory, beberapa membutuhkan fitur atau deployment khusus.

Inventaris memakai `package.json`, `bun.lock`, kode, migration SQL, serta workflow lokal. Versi “Current” di bawah berasal dari resolusi dependency yang dilaporkan Bun, bukan sekadar rentang manifest. Versi target merupakan snapshot registry hari audit dan perlu diperiksa ulang saat implementasi.

Panduan `docs/CODEX-NAVIGATION-GUIDE.md` yang disebut instruksi tidak ditemukan. Graph lokal bertanggal 15 Juni 2026 menunjuk commit `390234c6`, berbeda dari HEAD. Query graph dengan kosakata `prisma database auth seed dotenvx` hanya dipakai untuk navigasi; fakta dikonfirmasi dari file saat ini. Query dibatasi sekitar 1.000 token dan terpotong, sehingga tidak digunakan sebagai inventaris lengkap. Tidak ada ekstraksi graph/LLM baru; biaya token query eksternal graph tidak berlaku.

## Prioritas dependency

| Prioritas | Package dan kondisi saat ini | Target/usulan | Alasan dan verifikasi |
| --- | --- | --- | --- |
| P0 | Next `16.2.6` | Kandidat `16.4.2` | Audit mencatat 17 advisory, termasuk 3 critical. Beberapa bergantung pada Windows, AVIF, atau jalur OG tertentu. Baca panduan versi terpasang di `node_modules/next/dist/docs/`, release notes target, lalu periksa proxy/auth, Server Actions, cache, metadata, image optimization, dan build. |
| P0 | sharp `0.34.5` | Kandidat `0.35.5` | Ada 3 advisory high terkait library native. Dipakai langsung di `src/lib/image-metadata.ts`; uji metadata, resize, blur, WebP, serta instalasi binary pada target deployment. |
| P0 | better-auth dan @better-auth/passkey `1.6.18` | Kandidat pasangan `1.7.12` | Advisory Better Auth menyebut magic-link/email-OTP; konfigurasi repo yang dibaca memakai password, GitHub, dan passkey, sehingga relevansi eksploitasi khusus itu belum terbukti. Upgrade dan regresi auth tetap dipisahkan dari penggantian adapter ORM. |
| P0/P1 | Transitive dari shadcn, Prisma CLI, MDXEditor, commitlint | Refresh parent package dan lockfile, kemudian audit ulang | Critical `proxy-addr` perlu ditelusuri jalur dependencynya dan apakah digunakan saat runtime. Pisahkan tooling dari aplikasi; jangan menganggap semua temuan dapat dicapai lewat website. |
| P1 | resolutions `js-yaml: ^4.2.0`, `@hono/node-server: ^1.19.13` | Evaluasi ulang override dan hasil resolusi | Lock saat audit masih memuat `js-yaml 4.2.0` dan `@hono/node-server 1.19.14`. Rentang override bukan bukti versi aman sudah terpasang. Utamakan update upstream; override hanya bila kompatibilitas sudah diperiksa. |
| P1 | React/react-dom `19.2.4` | Kandidat pasangan `19.3.1` | Kerjakan bersama pemeriksaan peer dependency Next/MDX/editor/R3F; jangan biarkan versi React dan React DOM berbeda. |
| P1 | Tailwind/PostCSS `4.3.1`, Biome `2.5.0` | `4.3.3` dan `2.5.15` | Batch tooling/styling tersendiri; periksa perubahan lint dan rendering. |
| P1 | MDXEditor `4.0.3`, Neon `1.1.0` | `4.3.3`, `1.2.0` | Uji format konten serta kompatibilitas driver. Update Neon dapat digabung dengan fondasi Drizzle jika tidak diperlukan lebih awal. |
| P2 | Motion `12.40.0`, TypeScript `5.9.3`, resolver `5.4.0` | Tunda major `14.5.0`, `7.0.2`, dan `6.0.0` ke perubahan tersendiri | Bukan prasyarat migrasi secrets/ORM. Jangan menggunakan update massal ke latest. |
| P2 | three `0.182.0`, @types/three `0.184.1` | Selaraskan versi implementasi dan tipe | Uji scene R3F. Ini pemeriksaan kompatibilitas, bukan bug runtime yang sudah dibuktikan. |

`@vercel/og 0.11.1 → 1.0.3`, cropper `5.5.7 → 6.2.4`, dan sharp melintasi batas versi yang perlu review tersendiri. `prisma` memiliki latest `8.0.0-rc.23` pada registry; jangan mengambil prerelease itu untuk maintenance ini. Jika ada masa tunggu panjang sebelum Drizzle, evaluasi pembaruan trio Prisma/adapter dalam versi 7 yang kompatibel; jangan menambah migrasi Prisma major.

Bun lokal `1.4.0`, sementara CI mematok `1.3.13`. Selaraskan versi yang telah diuji beserta lockfile. `@types/node` berada pada major 20; pilih menurut runtime Node deployment, bukan latest major registry.

`shadcn` dan `prisma` saat ini berada di dependencies. Tinjau pemindahan CLI ke devDependencies setelah memastikan kebutuhan build/postinstall; pengelompokan ini sendiri tidak menghapus dependency dari lockfile atau semua laporan audit.

## Migrasi dotenvx ke Infisical

Dampak repo: 29 script memakai dotenvx, mencakup dev/build/start, generate/migrate/status/push/seed/studio/reset, serta backfill. Tiga sumber saat ini adalah `.env.local`, `.env.preview`, dan `.env.production`. CI build sudah memasok environment langsung dan menjalankan `next build`, bukan script dotenvx lokal.

Keputusan pengguna pada 21 Oktober 2026: gunakan Infisical Cloud. Rencana memakai Cloud sebagai sumber secrets terpusat, CLI untuk development lokal, machine identity untuk CI, dan secret sync ke Vercel. Project, region Cloud, dan pemetaan environment/branch ditentukan saat persiapan implementasi.

1. Tentukan organisasi/project Infisical Cloud, region, dan slug environment. Pemetaan usulan: local → development/dev, preview → preview, production → production/prod; gunakan slug yang benar-benar dibuat di project. Konfigurasikan CLI dan CI untuk region Cloud yang sama.
2. Inventarisasi nama variabel dan pemakainya, tanpa menyalin nilainya ke Git, laporan, atau log. Pisahkan variabel publik build, secret runtime, dan secret khusus administrasi seperti `DIRECT_URL`/seed owner.
3. Pin versi CLI dan catat cara instalasi Windows/CI. Pengembang memakai login pribadi. CI memakai machine identity dengan akses environment/path minimum dan metode autentikasi yang didukung runner.
4. Ubah wrapper script secara bertahap; mula-mula dev dan satu database command baca pada environment terisolasi. Pastikan precedence variabel dan loading otomatis file .env oleh Next/Bun tidak membuat nilai lama menutupi atau mencampur environment baru.
5. Untuk Vercel, usulan utama adalah secret sync dari Infisical ke environment Vercel. Dokumentasi menyediakan pemetaan Vercel Environment dan Git Branch. Pisahkan development, preview, dan production, termasuk database Neon preview. Verifikasi sync, cakupan branch, dan redeploy yang diperlukan untuk build/runtime.
6. Pertahankan `NEXT_PUBLIC_*` tersedia saat build. Pertahankan nilai auth, URL, dan kredensial yang sama saat cutover provider agar perubahan secrets tidak sekaligus merotasi identitas auth.
7. Setelah dev, CI, preview, dan produksi yang disetujui terbukti setara, hapus dependency dotenvx dan referensinya. Pertahankan `.env.example` berisi nama/contoh nonrahasia; tentukan kebijakan local override/offline secara eksplisit.

Kriteria selesai: environment tidak tertukar; Next dev/build/start dan script DB menerima variabel yang benar; CI autentikasi tanpa token pribadi; Vercel preview tidak memakai DB production; tidak ada secret dalam diff/log; dokumentasi onboarding cukup untuk mesin baru.

Rollback: kembalikan wrapper script dan konfigurasi deployment versi sebelumnya selama masa transisi. Penyaluran secrets lama dipertahankan secara terkontrol sampai verifikasi selesai; jangan menghapus satu-satunya salinan secrets.

## Migrasi Prisma ke Drizzle

| Permukaan | Temuan lokal |
| --- | --- |
| Schema | 19 model, 3 enum; SQL awal juga memiliki tabel junction implisit `_PostToTag`. |
| Konsumen DB | 38 file mengimpor `@/lib/db`. |
| Generated Prisma | 27 file mengimpor generated client/enum/type; sebagian overlap dengan konsumen DB. |
| Transaksi | 11 kemunculan `$transaction`, termasuk callback interaktif. |
| Migration history | 3 file migration SQL. Kondisi ledger pada server belum diperiksa. |
| Fondasi | `src/lib/db.ts` menggunakan PrismaNeon, Neon serverless, dan ws. |
| Auth | `src/lib/auth.ts` menggunakan Prisma adapter; mencakup User, Session, Account, Verification, Passkey, dan data profil tambahan. |
| Konsumen tambahan | Seed, backfill, sitemap, API views, preview, analytics, halaman publik/dashboard, dan enum di komponen UI. |

Jumlah file adalah hasil pencarian import langsung saat audit, bukan jumlah task atau ukuran total rewrite.

Keputusan usulan:

- Pertahankan Neon/PostgreSQL serta schema fisik saat mengganti ORM. Pilih pasangan Drizzle ORM/Kit stabil yang kompatibel dengan Better Auth hasil maintenance; versi tepat diputuskan setelah pemeriksaan release/peer dependency, bukan mengambil beta/RC otomatis.
- Gunakan driver Drizzle Neon berbasis WebSocket sebagai titik awal karena repo memakai transaksi interaktif. Dokumentasi Neon/Drizzle membedakan HTTP untuk query tunggal/transaksi noninteraktif dan WebSocket untuk session/transaksi interaktif. Jangan otomatis mengganti semua pemakaian menjadi HTTP.
- Mulai dari introspection database preview yang mewakili schema aktual. Dokumentasi Drizzle menyediakan `drizzle-kit pull`; cocokkan hasilnya dengan schema Prisma dan tiga migration SQL.
- Pertahankan nama tabel PascalCase, kolom camelCase, tipe timestamp/precision, nullability, enum PostgreSQL, index, unique constraint, foreign key/cascade, serta junction `_PostToTag`. Hindari rename bersamaan dengan cutover.
- Tentukan ulang pembangkitan ID dan pemutakhiran updatedAt di aplikasi/schema Drizzle. Schema SQL awal tidak memberikan default untuk banyak ID/updatedAt; menyalin struktur database saja belum menggantikan perilaku Prisma.
- Pertahankan data auth, hash password, token, passkey, ID pemilik, dan nilai `BETTER_AUTH_SECRET`. Perubahan adapter bukan alasan untuk reseed atau reset akun.
- Pindahkan enum/domain types yang dipakai UI ke modul bersama yang aman diimpor client. Database client tetap hanya berada di server.
- Pertahankan perilaku public API/Server Actions, bentuk hasil, `null`/kosong, pagination, ordering, error, serta invalidasi cache.

Urutan pekerjaan yang dapat direview:

1. **Fondasi dan baseline database.** Siapkan salinan/branch preview terisolasi, bukti backup/restore, inventaris tabel/constraint, schema Drizzle, serta konfigurasi koneksi. Tentukan baseline migration untuk database existing dan bootstrap untuk database kosong. Pastikan migration pembuka tidak mencoba membuat ulang tabel existing. Simpan arsip Prisma migration; tentukan pemilik migration selama transisi agar dua tool tidak menulis schema bersamaan.
2. **Pembacaan konten.** Pindahkan query halaman publik, sitemap, preview, dan pembacaan dashboard per domain. Bandingkan hasil Prisma/Drizzle pada fixture yang sama. Prisma dapat tetap tersedia sementara untuk domain yang belum dipindah; tidak perlu dual-write.
3. **Mutasi konten dan transaksi.** Migrasikan Posts/Tag, Projects/Screenshots, Gallery, Home/Testimonial, About, Settings/Media, dan view tracking per irisan. Ubah nested write/connectOrCreate, upsert, increment/decrement, serta transaksi menjadi operasi setara. Tinjau pola Gallery: callback `$transaction` di create masih memanggil `db` luar; scope transaksi harus dibuktikan, bukan sekadar disalin.
4. **Adapter auth.** Pindahkan ke adapter Drizzle sesuai versi Better Auth terpilih. Dokumentasi terbaru membedakan entry point adapter berdasarkan versi/relations; validasi schema mapping untuk lima tabel auth dan profil tambahan. Uji password, session existing, logout, GitHub bila dikonfigurasi, passkey, email change, serta owner-only guard.
5. **Seed dan utilitas.** Port `prisma/seeds/*`, `scripts/backfill-*`, tipe input, dan lifecycle koneksi. Uji seed berulang pada database disposable tanpa menimpa akun/data yang sudah ada; backfill harus tetap memiliki dry run.
6. **Cutover dan pembersihan.** Setelah semua pemakai berpindah, hapus Prisma client/adapter/CLI, generated imports, postinstall generate, konfigurasi dan script yang tak berlaku. Arsipkan riwayat SQL yang diperlukan, perbarui README, CI, ignore patterns, dan cara inspect/migrate/seed database.

Kriteria selesai: zero generated Prisma imports pada source aktif; seluruh pembacaan/mutasi menghasilkan perilaku setara; transaksi rollback saat kegagalan; tag/screenshot/order/view counter konsisten; sesi dan passkey lama bekerja; baseline existing tidak merusak data; database baru dapat dibuat dari nol; build/typecheck/lint/regresi lolos dengan dependency install frozen.

Rollback awal: kembalikan release aplikasi Prisma ketika schema fisik tetap kompatibel. Setelah migration Drizzle mulai mengubah struktur, rollback harus dievaluasi berdasarkan schema dan data saat itu; jangan menjanjikan bahwa revert kode cukup. Pisahkan rename/drop dan perubahan bisnis ke pekerjaan selanjutnya.

## Paket pelaksanaan yang disarankan

| Tahap | Hasil yang harus bisa direview | Gerbang sebelum lanjut |
| --- | --- | --- |
| 0. Baseline | Fixture dan regresi terarah untuk auth, content CRUD, relasi tag/screenshot, ordering, views, media | Jalur kritis mempunyai pemeriksaan yang bisa diulang; tentukan preview DB dan runtime deployment. |
| 1. Security/framework | Next + pasangan React yang kompatibel; sharp; pasangan Better Auth; refresh parent/transitive | Audit ulang, klasifikasi advisory tersisa, lint/typecheck/build dan regresi. Pisahkan auth dan image/native bila diff membesar. |
| 2. Tooling/update lain | Bun CI selaras; Biome/Tailwind/MDX dan update kompatibel per kelompok | Frozen install, lint/typecheck/build; visual editor/public dan scene 3D sesuai perubahan. |
| 3. Infisical | Script, CI, dokumentasi, dan rancangan sync Vercel | Dev dan preview setara; konfigurasi eksternal baru hanya diterapkan dengan izin eksplisit. |
| 4. Drizzle | Fondasi → reads → writes/transaksi → auth → seed → cleanup | Setiap irisan lulus parity dan regresi; schema cutover terverifikasi. |
| 5. Update major opsional | Motion/TypeScript/resolver/cropper/OG/three, sesuai kebutuhan | Satu kelompok kompatibilitas per perubahan; tidak menahan perbaikan keamanan. |

Security-sensitive update tidak perlu menunggu semua tooling rapi. Penilaian ukuran relatif: Infisical sedang; Drizzle besar karena lintas 19 model dan puluhan konsumen. Estimasi hari belum diberikan karena keadaan database, cakupan deployment, dan suite pengujian belum dikonfirmasi.

Keputusan sebelum implementasi eksternal: organisasi/project dan region Infisical Cloud; environment/branch tujuan; akses dan kebijakan Neon preview; runtime Node/Bun Vercel yang dipakai; serta apakah sesi auth lintas environment memang sengaja dibagikan. Audit hanya menemukan rekomendasi Vercel/Neon di README, bukan bukti konfigurasi akun aktif.

## Referensi

Sumber lokal utama: `package.json`, `bun.lock`, `prisma/schema.prisma`, `prisma/migrations/*/migration.sql`, `prisma.config.ts`, `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/image-metadata.ts`, `src/features/dashboard/*/actions.ts`, `src/app/api/views/[slug]/route.ts`, `prisma/seeds/*`, `scripts/backfill-*`, `.github/workflows/quality.yml`, `.github/workflows/trivy.yml`, `README.md`.

Dokumentasi primer yang diperiksa melalui Context7/web:

- Infisical CLI: `https://github.com/infisical/cli`.
- Infisical Vercel sync: `https://infisical.com/docs/integrations/cloud/vercel`.
- Drizzle introspection: `https://orm.drizzle.team/docs/drizzle-kit-pull`.
- Driver Neon dan transaksi: `https://orm.drizzle.team/docs/connect-neon`.
- Better Auth Drizzle adapter/schema mapping: `https://github.com/better-auth/better-auth/blob/main/docs/content/docs/adapters/drizzle.mdx`.

URL advisory beserta rentang versi dan severity tersimpan dalam artefak JSON. URL registry dan laporan package bukan bukti eksploitasi aplikasi.

## Pemeriksaan mutu laporan

Skill evaluasi mandiri digunakan untuk memeriksa hasil sebelum diserahkan.

| Aspek | Skor | Bukti dan perbaikan berikutnya |
| --- | --- | --- |
| Akurasi | 4/5 | Angka diperoleh dari Bun dan file; schema server/runtime deployment belum diperiksa. Konfirmasikan pada preview saat implementasi. |
| Kelengkapan | 4/5 | Secrets, ORM, update, rollback, dan gerbang tercakup; Infisical Cloud sudah dipilih. Konfirmasi project/region dan pemetaan deployment saat persiapan implementasi. |
| Kejelasan | 4/5 | Rencana terbagi menurut tahap; beberapa istilah teknis diperlukan. Ringkasan chat menyebut urutan dan hasil utama. |
| Dapat ditindaklanjuti | 4/5 | Ada permukaan file, urutan irisan, dan kriteria selesai; versi final Drizzle/Kit menunggu verifikasi kompatibilitas saat implementasi. |
| Keringkasan | 4/5 | Detail disimpan di dokumen dan data mesin; tabel update lengkap dipisah agar tidak memenuhi ringkasan. |

Rata-rata: 4,0/5. Perbaikan terbesar: konfirmasi deployment/preview serta project/region Infisical Cloud, kemudian tetapkan versi Drizzle/Kit/Better Auth yang telah diuji bersama. Penilaian ini sesuai batas permintaan audit/rencana; tidak menyatakan migrasi sudah diuji atau siap deploy.
