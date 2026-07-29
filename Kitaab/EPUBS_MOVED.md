# EPUBs are no longer hosted here

As of the `prod` branch, the actual `.epub` files have been **removed** from this repo.

They are now served exclusively by the **Kitaab API** at
`https://api.theothermeunfolded.com/api/kitaab` through a signed, single-use,
time-limited download flow (`POST /request-download` → `GET /download?token=…`).
This prevents the books from being scraped from public raw URLs.

The catalog, config, plugin registry and book covers are also served by the API
(`/templates.json`, `/config.json`, `/plugin-registry.json`, `/cover/:fileId`).
The `templates.json` / `config.json` / cover images left in this folder are legacy
and no longer used by the current app build.

To add/remove books, drop/delete the EPUB under `/data/epubs` on the server and run
`node scripts/sync-catalog.js` in the `dicapi` repo. See `KITAAB_SYSTEM.md` there.
