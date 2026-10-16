# Caras y conectores del hardware

Revisión documental: 16 de octubre de 2026. Las 14 fichas corresponden a 12
modelos físicos; FM-1 A/B/ensayo comparten el dibujo, conservando su identidad.
Se añaden 19 SVG autónomos: 12 traseras, cuatro laterales/bordes y tres paneles
superiores de conexiones. Hapax conserva además su componente interactivo.
Los otros ocho paneles superiores ya existentes se referencian sin duplicar
archivos, para alternar también entre controles y conexiones en el lienzo.

El catálogo reutilizable está en [`public/hardware/panels.json`](../public/hardware/panels.json).
Cada modelo declara fuentes, caras disponibles, cara inicial y conectores.
Cada conector tiene un ID estable, etiqueta, cara, coordenadas, formato físico,
señal, dirección y detalle. Los USB de señal declaran también `usbRole`.
La alimentación, tarjetas, interruptores, anclajes y pedales se conservan como
referencias físicas; no crean handles de audio/MIDI/CV/USB.

Las coordenadas están en el `viewBox` de su cara, mirando directamente los
conectores. `rear` es el borde alejado del intérprete al tocar el equipo y
`front` el próximo; los manuales de TE llaman “top side” al borde aquí trasero.
Las proporciones son esquemáticas, no dimensiones de fabricación. Los dibujos
son originales; no se redistribuyen los diagramas de los fabricantes.

| Modelo | Caras de conexiones | Distinciones verificadas en documentación |
| --- | --- | --- |
| Hapax | Trasera | USB-A host / USB-B device; DIN y TRS-A MIDI; CV/Gate; SD, pedal y DC |
| 0-Coast | Superior, izquierda; trasera sin puertos | 29 jacks superiores, incluido MIDI; alimentación de 15 V a la izquierda |
| Spectravox | Superior y trasera | 36 puntos de patch de 3,5 mm más combo; salida de 6,35 mm, DC y anclaje atrás; sin MIDI |
| EP-133 | Borde trasero | MIDI y sync IN/OUT separados; audio estéreo IN/OUT; USB-C y switch |
| EP-136 | Bordes trasero y frontal | CH1/CH2/AUX estéreo, OUTPUT y USB atrás; PHONES delante; sin MIDI TRS |
| OP-1 field | Derecha; trasera sin puertos | Audio IN/OUT de 3,5 mm, USB-C dual y switch en el extremo derecho |
| FM-1 | Trasera | Audio OUT, MIDI IN de 3,5 mm, USB-C y botón; no jack MIDI OUT |
| Quad Cortex original | Trasera | Combos, sends/returns, cuatro salidas, Capture, phones, MIDI, EXP1/2, USB-B y DC |
| KeyStep 32 / 37 mk2 | Trasera | MOD1/2, Gate, Pitch, sustain, Sync IN/OUT, MIDI DIN, USB-C y switch; sin DC separado |
| LiveTrak L6max | Superior, derecha; trasera sin puertos | 4 combos + 8 líneas; MIDI TRS-A; USB de datos arriba; otro USB-C lateral solo de alimentación y microSD |
| Bogen GDU150 | Base XLR | Vista directa de los tres pines XLR macho; sin base de sobremesa inventada |

Las fuentes exactas están junto a cada modelo en el JSON: manuales de TE,
Zoom, Make Noise, Neural DSP, M-VAVE y Bogen; fotos traseras separadas de los
dos KeyStep mk2; manual RevB indexado y descargas actuales de Moog. La URL
histórica del PDF Moog devolvió 404 durante esta revisión, pero su contenido
de patchbay y panel trasero sigue indexado; se enlaza primero la página de
descargas vigente. No se verificaron las unidades físicas. El manual FM-1
no especifica el estándar A/B de su TRS MIDI; no se le atribuye uno.

## Generación y reutilización

```sh
node scripts/generate-hardware-visuals.mjs
node scripts/generate-hardware-panels.mjs
```

El segundo generador contiene la transcripción documental y produce tanto
el JSON como los SVG, con `data-connector-id` por socket. No requiere red.
Los paneles superiores de Spectravox/L6max reutilizan los dibujos originales
de controles; el 0-Coast reconstruye la posición de sus jacks desde el panel
numerado y la foto del fabricante. Se corrigen las etiquetas del L6max a
canales 1–8, siendo 5–8 canales estéreo.

La ficha ofrece selector de cara, SVG descargable y tabla desplegable de
conectores con descarga del catálogo. Los SVG y el JSON pueden usarse en
riders u otros consumidores sin montar React. Los módulos React están en
`hardwarePanels.ts`, `DeviceHardware.tsx` y `HardwarePanelNode.tsx`.

## Cableado y compatibilidad

Los equipos nuevos incorporan sus puertos físicos al añadirse. Los setups
sin diseño guardado se siembran con entradas reales: CV va a 1V/oct y Gate al
contour/trigger correspondiente. Una ruta sin entrada inequívoca queda sin
cable y con explicación; nunca se inventa un MIDI IN. Las pistas TOML se
modifican únicamente al usar el flujo explícito de aplicar/guardar.

`Port.connectorId` separa el socket físico del ID de handle guardado. Un USB
bidireccional tiene dos handles sobre una sola toma, con pequeño desplazamiento
vertical. Los roles conocidos requieren host/device compatibles y una toma
USB admite un cable: una nueva conexión sustituye el cable anterior incluso
si se usa su otro handle. Los puertos genéricos conservan su comportamiento.
El lienzo valida familias de señal y roles USB; no calcula adaptadores,
impedancias, voltajes, pinout TRS desconocido ni rutas de audio dentro del USB.

Los diseños guardados conservan IDs y edges. Solo se asocia automáticamente
un puerto antiguo si hay una única entrada/salida de esa familia en ambos
lados de la correspondencia. Los ambiguos siguen visibles en una fila “Sin
correspondencia física”. “Añadir conectores del catálogo” agrega lo que falta
sin borrar esos handles ni sus cables. No se ejecuta al importar.

Al cambiar de cara, los conectores de otras caras pasan a filas con su
ubicación; el cable sigue en el mismo handle. `hardwareView` se conserva en
el workspace y sus exportaciones. “Ordenar cableado” distribuye los tamaños
actuales sin cambiar edges, mapas ni canales; los diseños previos mantienen
sus posiciones hasta que el usuario ordene.

## Validación

Vitest comprueba cobertura de modelos/caras, SVG locales y coordenadas,
variantes, ausencia de sockets inventados, roles y unicidad de USB,
compatibilidad de handles antiguos, seed CV/Gate y round trip de caras/cables.
Build TypeScript/Vite y ESLint forman parte de la verificación de publicación.
La QA de navegador conecta AUDIO OUT del OP-1 a INPUT 1 del Quad Cortex,
cambia el OP-1 a la cara trasera y comprueba que el mismo edge y sus handles
persisten en las filas de otras caras. No guarda ese cable de prueba en el
setup canónico. Las capturas y resultados de esta revisión se conservan en
`~/.codex/qa/hapax/hardware-panels-2026-10-16/`.

Resultado del snapshot aislado de publicación: 271 pruebas PASS en 21 suites,
ESLint PASS y build TypeScript/Vite PASS. La ficha trasera del Quad Cortex
muestra sus 18 elementos y el enlace al JSON en el build de producción local,
sin desbordamiento horizontal a 1280×720. La generación de los 19 SVG nuevos
y el JSON es determinista. Los warnings observados durante desarrollo fueron
recargas HMR de `nodeTypes`, no errores de handles perdidos.
