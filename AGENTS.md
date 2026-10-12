# Hapax Oconfig

Fork de turnerm5/studiograph, integrado como submódulo de ordenador/hapax.
Conservar historial y procedencia. No asignar una licencia ajena al original:
el baseline no declara licencia explícita.

Nunca crear/publicar ramas codex/. Usar feat/... o chore/...; conservar cambios
existentes. origin es ordenador/studiograph y upstream turnerm5/studiograph.
Revisar SHA/diff antes de mergear upstream. Probar npm run test, npm run lint y
npm run build antes de publicar; no esconder fallos excluyendo tests.

Usar npm ci con package-lock. Si se introduce Python, usar uv. El harness de
Vitest prepara localStorage antes de importar Zustand; no usar almacenamiento
real compartido de Node ni depender del orden de las declaraciones del test.

Equipos y setups canónicos viven en el repo Hapax contenedor. JSON StudioGraph
no equivale a un save nativo Hapax. No escribir SD, MIDI o dispositivos ni
flashear FM-1 como efecto de editar/exportar. Mario autorizo reorganizar la UX,
visualizacion y librerias si mejoran el flujo con evidencia. Guardar fichas en
el repo por la API local, preservando campos desconocidos y conflictos.
