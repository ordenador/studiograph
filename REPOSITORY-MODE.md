# Hapax Oconfig — repository workspace

Default route loads devices/setups from the parent Hapax repository through its
loopback API. Start from that repository with make oconfig-dev; npm run dev alone
needs an API already running. The proxy target is HAPAX_API_PORT (8796 default).
The setup's Cableado libre integrates all editing capabilities. There is no
separate application; old bookmarks redirect to the workspace.

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
editable graph is under Cableado libre. The sidebar equipment catalog collapses,
search reveals matching equipment, and narrow screens use a Biblioteca button.

The address bar tracks the current setup and view. Copy it directly or use
Copiar enlace. Examples:

- `/?setup=felucca-duo&tab=hapax` opens Panel Hapax.
- `/?setup=felucca-duo&tab=hapax&panel=top` opens its top reference.
- `/?setup=felucca-duo&tab=tracks&track=4` opens B Bell for editing.
- `/?setup=studio&tab=hapax&port=A` inspects MIDI A.
- `/?setup=felucca-duo&device=fm1-b` opens the unit's metadata.

The tabs are home, connections, tracks, hapax, canvas and settings. Reload and
back/forward restore the view. A draft remains when changing tabs within its
record; leaving it prompts to keep editing or discard, including browser back.
Links describe the view, using the saved repository data; they do not contain
draft edits or turn on hardware assignment mode. Unknown records show an error
and a route back home. Clipboard failures expose a selectable URL.

The rear panel draws configured output-to-device routes, with channels and a
track list. CV/Gate pairs use both physical jacks. Unassigned tracks get a clear
message and a shortcut to Pistas; no cables are invented for NULL outputs.

The parent repository documents UX, API, limitations and maintenance in
 docs/studiograph-ux.md and docs/studiograph-fork.md. This app does not commit,
push, access MIDI/USB devices, flash firmware or write SD cards. Definitions
in HAPAX/ are read-only. Designs store their edited CC/NRPN, ASSIGN, automation,
drum lanes, ports, Local Off, icons, presets and source definitions as versioned
JSON in the setup's `oconfig_workspace` TOML field. The save is atomic with the
rest of the setup, retaining comments/unknown fields and optimistic conflicts.
Generated TXT downloads merge edited sections into the original source so PC,
input options, comments, unknown sections and NRPN 14-bit depth survive.

New designs load canonical track routes and full source definitions. A block
represents a track (one physical unit may have several blocks). The rear Hapax
node shows connector positions from our schematic; its lower handles correspond
to outputs and upper handles to input returns. This is a plan, not live hardware.
Automatic layout uses short rows and respects node widths. Ordering a saved
design is explicit and undoable; positions persist with Guardar en repo.

Applying a design updates only ports/channels on linked tracks and refuses
ambiguous multiple destinations. Names/definition choices remain editable in
Pistas. Changes to canonical tracks flag an older design for review; reconstruct
from tracks only on explicit request. Deleting a block does not delete its
canonical track. Unbound equipment stays in the design without silently creating
tracks or claiming physical verification.

JSON import/export remains optional for backup compatibility. The old browser
storage is retained read-only for explicit recovery; the active workbench uses a
different key. Custom catalog equipment can be reused from other saved setups.
