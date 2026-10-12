# Fork de Mario para Hapax

Original: https://github.com/turnerm5/studiograph
Baseline: 01632387f7b5433fb1cfcb8d2a436ec2f846c831
Fork: https://github.com/ordenador/studiograph
Rama de adaptación: feat/hapax-maintenance

El repo ordenador/hapax incluye esta app como submódulo y documenta instalación,
ejecución y actualizaciones en docs/studiograph-fork.md. Allí viven nuestros
equipos, setups, canciones, definición canónica y herramientas de exportación.

Primer cambio: preparar localStorage antes de importar el store en las pruebas
Node, compartir el objeto entre store/tests y corregir prefer-const. Conserva
las 226 pruebas existentes y sus assertions; sin cambios del flujo de la UI.
Tests, lint y build pasan con Node 26.11.1/npm 11.20.0.

El original no declara licencia explícita en el baseline revisado. Se conserva
la autoría/historial y no se le asigna una licencia nueva. El JSON de esta app
no es un proyecto nativo Hapax; importación física permanece sin certificar.
