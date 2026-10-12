# Hapax Oconfig — repository workspace

Default route loads devices/setups from the parent Hapax repository through its
loopback API. Start from that repository with make oconfig-dev; npm run dev alone
needs an API already running. The proxy target is HAPAX_API_PORT (8796 default).
The existing independent editor remains at /standalone and retains JSON flows.

Repository mode saves canonical device.toml/setup.toml records, not exported
StudioGraph JSON or native Hapax saves. The parent API preserves unknown fields,
checks revisions before writes, creates local backups and replaces one TOML
atomically. UI has pending/save/error states, undo, explicit save and Ctrl/Cmd+S.
The home page previews a setup with an ordered visual map: Hapax, named outputs,
direction arrows and one row per physical unit. Expand equipment to see its
parts/channels and jump to the selected track. The setup stays selected when
returning home. NULL routes have an incomplete dashed line, no direction arrow,
and an action to choose the output; they never invent a cable.

Track routing uses a readable list with controls revealed per track. Metadata
lives under Ajustes; the rear/top Hapax SVG is under Panel Hapax, and the original
movable graph is under Canvas libre. The sidebar equipment catalog collapses,
search reveals matching equipment, and narrow screens use a Biblioteca button.

The parent repository documents UX, API, limitations and maintenance in
 docs/studiograph-ux.md and docs/studiograph-fork.md. This app does not commit,
push, access MIDI/USB devices, flash firmware or write SD cards. Definitions
are currently read-only, keeping all PC/default/NRPN/ASSIGN sections intact.
