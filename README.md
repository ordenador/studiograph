# Hapax Oconfig

Editor local de equipos, setups, cableado y definiciones de instrumento para Hapax.
Basado en [StudioGraph de turnerm5](https://github.com/turnerm5/studiograph),
conservando historial y autoría. Todo se trabaja desde la misma aplicación.

## Arrancar

Desde el repositorio contenedor [ordenador/hapax](https://github.com/ordenador/hapax):

```sh
make oconfig-setup
make oconfig-dev
```

Abrir [Hapax Oconfig](http://127.0.0.1:8795/). La API local se inicia junto con la
app. Dentro de este submódulo, `npm run dev` requiere esa API ya disponible.
`make oconfig-check` ejecuta tests, lint y build con el lock del fork.

## Trabajar con un setup

**Inicio** permite elegir un setup y seguir Hapax → salida → equipo físico.
Abrir un equipo muestra sus partes y permite saltar a una pista. En el editor:

- **Conexiones**: recorrido ordenado hacia cada equipo.
- **Pistas**: nombres, equipo, salida, canal y definición compartida.
- **Panel Hapax**: referencia superior/trasera y salidas configuradas.
- **Cableado libre**: edición completa del diseño y sus parámetros.
- **Ajustes**: nombre, clock y estado registrado del setup.

**Guardar en repo** o Cmd/Ctrl+S conserva el borrador. **Deshacer** recupera el
último cambio; **Recargar** vuelve a la ficha del repo. El guardado comprueba
revisiones, crea un respaldo local y conserva comentarios/campos desconocidos.
**Copiar enlace** comparte setup, pestaña, pista o conector inspeccionado;
por ejemplo `/?setup=studio&tab=canvas`. Los enlaces usan los datos guardados.

## Cableado y parámetros

El panel trasero vectorial de Hapax es el origen del diagrama. Las pistas se
ordenan en filas cortas y las conexiones de filas posteriores pasan por los
márgenes. Se puede arrastrar, ampliar o mover los bloques. **Ordenar cableado**
reorganiza un diseño guardado sin alterar mapas ni cables y permite deshacer.

**Equipos y catálogo** incorpora equipos del repo y equipos personalizados,
reutilizables desde otros setups guardados. Permite editar nombres, iconos y
puertos MIDI, audio, CV y USB; cargar CSV y buscar mapas en midi.guide. Los
puertos que el repo no describe quedan por definir. Arrastra o usa Añadir al
cableado; después une puntos de conexión del mismo tipo.

Seleccionar un bloque abre puertos/mapas CC/NRPN, canal, POLY/DRUM/MPE,
Local Off, ocho ASSIGN, hasta 64 automatizaciones CC/PB/AT/CV/NRPN y DRUMLANES.
Los bucles MIDI se señalan; Local Off permite declarar la interrupción del
retorno. Un bloque representa una pista: varias partes pueden pertenecer a una
misma unidad física.

**Aplicar a pistas** copia salidas y canales de los bloques vinculados; rechaza
salidas ambiguas. El diseño se guarda completo en `oconfig_workspace` dentro
del setup TOML. Si cambian las pistas, aparece un aviso: reconstruir desde
ellas requiere una acción explícita. Dibujar cables no modifica dispositivos.

**Descargar definiciones TXT** genera los instrumentos conectados a Hapax,
incluidas rutas a través de MIDI Thru. Las fuentes existentes conservan PC,
INPORT/MAXRATE, comentarios, opciones desconocidas y profundidad NRPN 14-bit.
Los archivos compartidos de HAPAX/ permanecen intactos; los mapas editados viven
en el diseño. Una definición TXT o un JSON no es un save nativo de Hapax.

## Respaldo y mantenimiento

JSON es opcional para descargar o recuperar un diseño compatible. También se
puede recuperar explícitamente el diseño anterior guardado en el navegador;
ese almacenamiento se conserva. Los enlaces antiguos abren la app integrada.

El SVG transparente del logo está en `public/oconfig.svg` y su PNG en
`public/oconfig.png`. Sus colores se inspiran en los pads de Hapax, sin presentar
el logo como una marca oficial de Squarp.

[REPOSITORY-MODE.md](REPOSITORY-MODE.md) documenta datos, guardado y límites.
El repo contenedor describe [mantenimiento del fork](../../docs/studiograph-fork.md)
y [UX](../../docs/studiograph-ux.md). La app no hace commit/push, escribe SD,
usa MIDI/USB ni flashea firmware. El fork mantiene la procedencia original;
el baseline upstream no declara licencia explícita.
