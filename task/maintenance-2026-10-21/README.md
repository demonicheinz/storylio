# Maintenance Storylio — 21 Oktober 2026

Catatan dan bukti maintenance disimpan di folder ini. Laporan per tahap adalah
snapshot saat tahap tersebut dikerjakan; index ini memuat status terbaru.

| Tahap | Catatan |
| --- | --- |
| Audit awal | [maintenance-audit-2026-10-21.md](maintenance-audit-2026-10-21.md) |
| Keamanan dan testing | [security-maintenance-2026-10-21.md](security-maintenance-2026-10-21.md) |
| Migrasi Infisical | [infisical-migration-2026-10-21.md](infisical-migration-2026-10-21.md) |
| Migrasi Drizzle | [drizzle-migration-2026-10-21.md](drizzle-migration-2026-10-21.md) |

Bukti pemindaian dan verifikasi berada di `evidence/`. File-file tersebut tidak
berisi nilai secret atau ekspor data aplikasi.

Status: kode Drizzle, 49 tes, 6 pemeriksaan browser, build, lint, dan typecheck
telah lolos. Adopsi baseline metadata pada dev, staging, dan prod selesai
dengan persetujuan pengguna. Ketiganya terverifikasi `applied: 1`, `pending: 0`,
dan `requiresBaseline: false`; tabel serta data aplikasi tidak diubah.
Lihat [bukti adopsi baseline](evidence/drizzle-baseline-adoption-2026-10-21.json).
Tindak lanjut temuan dan verifikasi terbaru: [review Drizzle](drizzle-review-2026-10-21.md).

Panduan operasional yang tetap dipelihara:

- [Infisical setup](../../docs/INFISICAL_SETUP.md)
- [Drizzle migration](../../docs/DRIZZLE_MIGRATION.md)

Helper sementara dan diagnostik lokal berada di
`.tmp/maintenance-2026-10-21/`, diabaikan Git dan tidak termasuk source aplikasi.
