# Perbaikan keamanan dependency dan fondasi testing

Tanggal: 21 Oktober 2026 (Asia/Bangkok). Melanjutkan audit pada commit `5a6b2f3`.

## Hasil

Audit dependency turun dari 85 advisory pada 25 package menjadi satu advisory high pada `braces@3.0.3`. Semua advisory critical yang tercatat pada audit awal sudah hilang dari hasil scan. Ini tetap pemetaan advisory dependency, bukan pembuktian eksploitasi setiap route.

`braces` belum memiliki rilis perbaikan di registry yang diperiksa. Jalur dependency adalah `micromatch → fast-glob`, yang dipakai shadcn/registry dan ts-morph. Tidak ditemukan import langsung pada source aplikasi. Temuan tidak disembunyikan; status dan ID advisory juga dicatat dalam `SECURITY.md`.

## Perubahan

- Next `16.2.6 → 16.4.2`; `partialPrefetching: false` mempertahankan perilaku navigasi lama selama upgrade keamanan.
- Better Auth dan passkey `1.6.18 → 1.6.33`, dengan rentang `~1.6.33` agar tetap pada maintenance line yang sama.
- sharp `0.34.5 → 0.35.5`.
- Trio Prisma client/adapter/CLI `7.8.0 → 7.10.1`. Client dihasilkan ulang; tidak ada migrasi schema/database.
- Tailwind dan PostCSS adapter `4.3.1 → 4.3.3`; shadcn `4.11.0 → 4.22.1`.
- Override lama dinaikkan ke minimum perbaikan `js-yaml ^4.3.2` dan `@hono/node-server ^1.19.15`.
- Sebelas dependency transitif diperbarui di dalam rentang parent: SimpleWebAuthn, baseline-browser-mapping, body-parser, brace-expansion, browserslist, fast-uri, hono, ip-address, proxy-addr, qs, source-map-js.
- OG route memakai `next/og`; dependency langsung `@vercel/og` dihapus karena membawa sharp lama.
- React, framework ORM, dan provider secrets belum dimigrasikan.

## Standar testing yang ditetapkan

Pengguna memilih Vitest serta Playwright CLI dalam percakapan yang sama.

- `vitest ~4.1.12` untuk unit/integration, Node environment dan alias `@/`, konfigurasi `vitest.config.mts`. Jalur 4 mendukung rentang Node/types yang sudah ada; versi 5 memerlukan baseline Node/types yang lebih tinggi.
- `@playwright/cli 0.1.22` untuk browser smoke/debug, konfigurasi Chromium headless terisolasi di `playwright-cli.config.json`.
- `bun run test`, `test:watch`, `test:security` untuk Vitest; `browser:install`, `browser:open`, `test:browser`, dan `browser close` untuk flow browser.
- Unit/integration masuk workflow Quality Checks. Browser smoke dijalankan terpisah terhadap aplikasi lokal yang sudah berjalan.
- Instruksi jangka panjang dicatat dalam `AGENTS.md` dan bagian Testing pada `README.md`.

## Verifikasi lokal

| Pemeriksaan | Hasil |
| --- | --- |
| Frozen install dengan lifecycle scripts dilewati | Lolos, tidak mengubah instalasi/lockfile. |
| Prisma generate | Lolos, client 7.10.1. |
| Vitest | 2 file, 8 test lolos. |
| Playwright CLI | 6 pemeriksaan flow browser lolos. |
| HTTP produksi dengan dummy env | Form/CSP, redirect dashboard, sesi anonim, PNG OG lolos. |
| Typecheck | Lolos. |
| Lint | Lolos; 236 file. |
| Build final | Lolos; Next 16.4.2, 35/35 halaman statis dihasilkan. |
| Diff whitespace | Lolos. |
| GitHub Actions remote | Belum dijalankan; hanya konfigurasi workflow lokal yang berubah. |

Vitest menguji handler auth tanpa sesi, signup yang dinonaktifkan, origin tidak dipercaya, owner allowlist, pipeline metadata/blur gambar, input gambar invalid, dan OG PNG 1200×630.

Better Auth melewati origin check ketika NODE_ENV=test. Fixture Vitest secara eksplisit memakai NODE_ENV=production dan TEST=false sebelum import auth, menggunakan nilai dummy, dan memulihkan env setelah suite selesai. Tes tidak mengubah konfigurasi auth produksi.

Browser smoke menguji form sign-in dan hidrasi toggle password, redirect dashboard beserta callback, sesi anonim, PNG OG, serta tidak adanya page error/console error selama flow. Challenge autofill passkey memakai route fixture untuk menghindari write verification ke database. Sign-in WebAuthn sebenarnya, OAuth, dan session existing dengan database belum diverifikasi. Browser testing memakai server lokal dengan dummy auth/database env. Sesi browser dan server testing sudah ditutup.

Coverage keseluruhan aplikasi belum diukur; delapan test ini adalah baseline terarah, bukan klaim cakupan seluruh CMS.

## Langkah selanjutnya

Review diff dan lakukan verifikasi login/password, session existing, GitHub OAuth bila aktif, dan passkey pada preview dengan database auth khusus. Pantau patch upstream braces. Setelah tahap keamanan direview, lanjutkan rencana Infisical Cloud lalu Drizzle. Provisioning eksternal, push, dan deploy belum dilakukan.

## Pemeriksaan mutu

| Aspek | Skor | Bukti dan batas |
| --- | --- | --- |
| Akurasi | 4/5 | Hasil scan dan checks berasal dari eksekusi lokal; penerapan di Vercel dan workflow remote belum diverifikasi. |
| Kelengkapan | 4/5 | Perbaikan yang tersedia, sisa advisory, rollback lewat diff/lockfile, dan pilihan testing tercakup; auth dengan kredensial/database nyata masih memerlukan preview. |
| Kejelasan | 4/5 | README memisahkan unit/integration otomatis dan browser smoke; detail advisory tetap ada di SECURITY.md. |
| Dapat ditindaklanjuti | 4/5 | Script, konfigurasi, suite, dan CI lokal tersedia; penerapan produksi tetap membutuhkan review deployment. |
| Keringkasan | 4/5 | Snapshot data dipisah dari ringkasan; laporan ini mempertahankan detail yang dibutuhkan untuk review. |

Rata-rata 4,0/5. Perbaikan utama berikutnya: validasi auth lengkap di preview dan coverage domain CMS saat migrasi ORM. Penilaian sesuai scope perubahan lokal, tanpa menyatakan seluruh aplikasi sudah bebas celah.
