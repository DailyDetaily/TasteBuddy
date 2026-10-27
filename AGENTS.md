# Taste Buddy project instructions

## Data-backed components: definition of done

- A graph, count, badge, summary, ranking, progress indicator, or other data-dependent product component is not complete with fixture data alone. Trace and connect its existing account-scoped backend/repository → validated aggregation → web/native presentation path.
- Reuse the existing repositories and original records. Do not add a new API/table merely to store derivable display values, color levels, or normalized percentages. Keep presentation/color rules separate from persisted source data.
- Before implementation, specify the unit (meal, dish record, response, etc.), period, date source/time zone, denominator, deduplication, unknown/future handling, and user/account scope. Never substitute save time for an unconfirmed meal date or invent source classifications.
- Update every affected web/native caller, shared rule, legend, documentation, and Figma definition in the requested scope. Product views must use real repository data; clearly marked design-system specimens may keep synthetic data. Respect an explicit design-only request, and state that backend/product integration remains outside that request.
- Handle loading, known-empty/zero, unavailable/unknown, error/retry, stale/offline data, and account changes. Do not turn failed or incomplete reads into zero, show another account's cached values, or render stale values as fresh.
- Verify save/restore/update/delete propagation and account isolation at the repository/aggregation boundary. Use matching web/native fixtures for shared calculations and check the real calling screen when feasible. Distinguish local/mocked, simulator/device, and production evidence; never claim a production connection was verified from a unit test.
- Preserve unrelated changes in this shared worktree. Do not deploy migrations, change production data, or seed real accounts as an implicit verification step.

Current graph contract and integration: `docs/design/data-component-contract.md`.

## Archived project materials

- Large historical materials may live in the project's Google Drive archive. Before regenerating or treating a missing historical output as lost, consult `docs/operations/google-drive-archive.md` and the manifests listed in `docs/operations/google-drive-archives.json`.
- Use `python3 scripts/drive-archive.py find <keyword>` to locate an original path and its Drive ZIP. Download the required package through the connected Google Drive account, then use the script's checksum-verified `restore` command. Preserve differing local files and current source/runtime assets.
