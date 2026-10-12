# Hapax repository workspace

Default route loads devices/setups from the parent Hapax repository through its
loopback API. Start from that repository with make studio-dev; npm run dev alone
needs an API already running. The proxy target is HAPAX_API_PORT (8796 default).
The existing independent editor remains at /standalone and retains JSON flows.

Repository mode saves canonical device.toml/setup.toml records, not exported
StudioGraph JSON or native Hapax saves. The parent API preserves unknown fields,
checks revisions before writes, creates local backups and replaces one TOML
atomically. UI has pending/save/error states, undo, explicit save and Ctrl/Cmd+S.
Track routing is edited in a table, with a physical-device graph and original
rear/top Hapax SVG as complementary views. NULL routes never invent a cable.

The parent repository documents UX, API, limitations and maintenance in
 docs/studiograph-ux.md and docs/studiograph-fork.md. This app does not commit,
push, access MIDI/USB devices, flash firmware or write SD cards. Definitions
are currently read-only, keeping all PC/default/NRPN/ASSIGN sections intact.
