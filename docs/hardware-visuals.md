# Vistas superiores del hardware

Las caras de conexiones, SVG adicionales y catálogo de puertos se documentan
en [hardware-panels.md](hardware-panels.md). Esa ampliación permite cambiar
de cara en fichas y cableado, conservando la fase superior descrita aquí.

Revisión: 16 de octubre de 2026. El catálogo visual cubre 14 identificadores
de equipo, correspondientes a 12 modelos. `fm1-nrpn-test` es una referencia de
ensayo de una de las dos unidades FM-1, con identidad A/B pendiente.

Se mantiene el SVG existente `HapaxHardware`. Los otros once modelos tienen
SVG originales en `public/hardware/`, reproducibles con:

```sh
node scripts/generate-hardware-visuals.mjs
```

Las vistas se muestran en la galería de Inicio, en las fichas, en los destinos
de Conexiones y en los nodos de Cableado libre que conservan un ID del catálogo.
Cada ficha ofrece la fuente del fabricante y descarga del SVG nuevo. Los
equipos personalizados sin ID conocido muestran una referencia pendiente,
sin atribuirles la imagen de otro instrumento. Los títulos editables no
determinan qué equipo se dibuja. Los diseños antiguos identifican el equipo
por su preset `repo:*` o nodo `track-N-*`; los nuevos guardan `hardwareId`.

## Búsqueda y procedencia

La búsqueda incluyó cada modelo declarado y términos SVG/vector/panel. Se
encontraron SVG en [MIDI Guide para 0-Coast](https://midi.guide/d/make-noise/0-coast/)
y [OP-1 field](https://midi.guide/d/teenage-engineering/op-1-field/), y una
[plantilla comercial de Quad Cortex](https://cutfilelabs.com/downloads/neural-dsp-quad-cortex-cut-file-template/).
No se verificaron condiciones específicas de reutilización de las imágenes
de MIDI Guide; la licencia mostrada para su dataset MIDI no se asumió como
permiso de las imágenes. La plantilla comercial no se compró. Para EP-133
apareció una recreación React Native, sin verificar un SVG autónomo reutilizable.
Para los demás no se verificó un vector reutilizable en los resultados revisados;
esto no afirma su inexistencia en toda la web.

Se crearon dibujos propios con una representación coherente. No se copian
fotografías, rutas SVG de terceros, logotipos vectoriales ni pantallas del
fabricante en los assets nuevos. Las etiquetas de modelo son texto. Las
referencias, imágenes consultadas y decisión por modelo están en
[`sources.json`](../public/hardware/sources.json).

Los dibujos son esquemas de reconocimiento: conservan la distribución
principal de controles y proporciones aproximadas. No son planos de medidas,
skins, simuladores ni botones funcionales. Las pantallas nuevas son neutras.
No modifican MIDI, puertos, canales, firmware, estado de verificación ni fichas
TOML. El Hapax conserva sus capturas de referencia de Step ya documentadas.

## Validación

Segunda revisión visual del 16 de octubre, tras la observación de Mario:
el OP-1 original resultaba genérico y su teclado de piano no representaba
la forma del instrumento. Se redibujó con el
[packshot superior oficial](https://assets.teenage.engineering/_img/627cab620e44b900044f3c11_1024.png):
panel de bloques, transporte 3×3, altavoz circular, 14 teclas blancas
redondeadas, 10 tapas negras circulares, disposición y colores field de los
encoders. La pantalla muestra un diagrama vectorial neutro de cinta.

La revisión general detectó además dos problemas de presentación: el encuadre
de altura fija dejaba demasiado espacio en las fichas de equipos anchos y
la nota de la unidad FM-1 de ensayo desplazaba la miniatura frente a sus
vecinas. Las fichas ahora usan la proporción de su SVG; la galería alinea
las imágenes arriba, ofrece más ancho por columna y usa un hover neutro.
La ampliación solicitada por Mario eleva también el Quad Cortex (rejilla de
pantalla vacía y footswitches con base hexagonal), LiveTrak L6max (tira azul,
anillos de canal, Scene, EFX, sección de grabación y medidores neutros), 0-Coast
(rutas serigrafiadas, secciones y ajuste fino) y EP-136 (faders, puertos y
display segmentado sin señal). EP-133 gana estructura de display; los mandos y
botones del conjunto tienen borde, tapa y relieve legibles. FM-1, KeyStep,
Spectravox y micrófono conservan su distribución reconocible. Esta revisión
visual no certifica dimensiones mecánicas.

Estándar mínimo para mantener los próximos cambios:

- Silueta y proporción propias del modelo, sin estirar la imagen al encuadrar.
- Distribución y número de sus controles distintivos; teclas, pads y jacks
  con su forma correspondiente, evitando símbolos genéricos de instrumento.
- Etiquetas y separación suficientes para reconocer secciones al ampliar;
  contraste y rasgos principales reconocibles en miniatura.
- Pantallas e indicadores estáticos documentados, sin atribuirles datos de
  la canción o actividad de la unidad física.

Para reutilizar en un rider: los once `public/hardware/*.svg` son autónomos y
no requieren fotos, red ni fuentes externas. El FM-1 comparte `fm1.svg` entre
las fichas A/B/ensayo. Hapax aún se renderiza con
`src/components/Repository/HapaxHardware.tsx`, props `view="top" compact
panelOnly`; no existe un `public/hardware/hapax.svg`. Su componente sí usa las
capturas de Step locales documentadas en `src/assets/hapax/sources.json`.

- Suite de Vitest del workspace: 275 pruebas PASS, incluidas cobertura de
  assets, resolución de IDs, referencias FM-1 y fallback para equipos desconocidos.
- Snapshot aislado del commit: 262 pruebas PASS, lint y build PASS. Excluye
  los otros cambios locales de SD, rider y preparación musical aún sin commit.
- `npm run lint` y `npm run build`: PASS.
- Revisión en navegador: galería de 14 fichas, ampliación y enlaces de descarga;
  vistas en Conexiones y Cableado libre. No se guardaron cambios de setup.
- Revisión con viewport nativo de 1280×720, panel estrecho de 412 px y ancho
  intermedio de 846 px, sin redimensionar la pestaña de Mario. A 846 px se
  verificó el mapa en una columna y miniaturas de 84 px, con 308 px para texto.
- No hubo validación ni escritura de hardware físico.

Para añadir un modelo: documentar su fuente, crear SVG, registrar el ID en
`hardwareVisuals.ts` y revisar galería, ficha y cableado con el equipo concreto.
