# Benchmark CPU de métricas de ancestros

Medición del 8 de septiembre de 2026 con Bun 1.3.8, macOS arm64. Compara el código previo al refactor con la implementación actual; no mide GPU ni FPS.

## Estrategia implementada

El renderer crea el resolver al procesar el primer registro, después de layout y del ajuste de scroll. La caché dura únicamente ese `update()`.

- Para varios registros, el mapa conserva contextos que pueden servir a descendientes. Una pila resuelve iterativamente los ancestros pendientes, sin recorrer previamente la colección activa.
- El último resultado de hoja se comparte entre su panel y texto, que se procesan consecutivamente. Las hojas no calculan scroll ni clipping de salida, porque no tienen descendientes. Esta optimización utiliza la garantía de que cada registro se procesa una vez: el helper no es una caché general para consultar repetidamente hojas en cualquier secuencia.
- Si la planificación selecciona exactamente un registro, un recorrido ascendente acumula posición, opacidad y clipping, sin construir un mapa por ancestro. Solo se memoiza su resultado cuando las máscaras seleccionan tanto panel como texto. Si no hay registros seleccionados, no se crea el resolver.
- El clipping recibido es absoluto; el panel lo convierte a relativo y el run lo conserva absoluto. Se rechazan explícitamente las intersecciones vacías. Los helpers de hit testing permanecen independientes y leen el estado actual.

El ajuste respecto a la propuesta uniforme responde a las mediciones: guardar cada ancestro en un mapa empeoraba los cambios de una sola hoja profunda, aunque aceleraba mucho las actualizaciones completas. Se conservan las máscaras, el formato de los buffers y la semántica de root, scroll y clipping.

## Reproducción del benchmark

Desde la raíz del proyecto:

```sh
bun scripts/benchmark-render-metrics.ts > /tmp/renderer-metrics.json
bun scripts/benchmark-render-metrics.ts --baseline-root /ruta/a/version-anterior > /tmp/renderer-metrics-comparison.json
bun scripts/benchmark-render-metrics.ts --baseline-root /ruta/a/version-anterior --filter chain-512/panel-text/full
```

`--source-root` permite elegir otra raíz para la versión nueva. Antes de modificar código se puede conservar una base sin utilizar Git:

```sh
baseline_dir=$(mktemp -d /tmp/uno-metrics-baseline.XXXXXX)
cp -R src "$baseline_dir/src"
cp package.json "$baseline_dir/package.json"
ln -s "$PWD/node_modules" "$baseline_dir/node_modules"
```

Después de implementar, pasar ese directorio mediante `--baseline-root`. La comparación de esta entrega utilizó `/tmp/uno-metrics-baseline.Qj2FqR`; el resultado completo de la ejecución está en `/tmp/uno-metrics-results.json`. Esos archivos temporales documentan esta sesión; el benchmark permanente permite repetir el procedimiento con nuevas copias.

Cada escenario y muestra usa un proceso nuevo. Se alterna el orden de ambas versiones, con cinco muestras, al menos 250 ms de calentamiento y lotes medidos de al menos 100 ms. El aislamiento por escenario evita mezclar su entrenamiento del JIT. La construcción, preparación de operaciones, layout, copias y contadores quedan fuera del intervalo. Solo se mide `renderer.update()` sobre operaciones capturadas y registros inicializados.

Los árboles contienen raíz más 16 o 1.024 hijos, o raíz más una cadena de 256 o 512 nodos. La variante de texto coloca dos glifos por nodo. La raíz no dibuja; recorta y tiene scroll. Las cadenas añaden clipping y scroll cada 32 nodos; las opacidades no decaen con la profundidad. Un probe independiente comprueba que ningún registro esperado se descarte, copia los buffers y compara entre versiones los hashes, capacidades, bytes y llamadas. La cola GPU del intervalo cronometrado no copia ni acumula historiales.

## Resultados

Valores en microsegundos por actualización: mediana ± desviación absoluta mediana (MAD), redondeadas a 0,001 µs. El factor es tiempo anterior / tiempo nuevo; mayor que uno indica mejora. El JSON conserva la precisión de las cinco muestras, mínimos, máximos y los datos del probe.

| Escenario | Anterior, µs | Nuevo, µs | Factor |
| --- | ---: | ---: | ---: |
| small-16/panel/full | 3.144 ± 0.033 | 3.194 ± 0.005 | 0.984× |
| small-16/panel/background | 0.261 ± 0.001 | 0.267 ± 0.002 | 0.976× |
| small-16/panel/opacity | 4.238 ± 0.045 | 4.272 ± 0.064 | 0.992× |
| small-16/panel/pointerEvents | 0.039 ± 0.000 | 0.037 ± 0.000 | 1.060× |
| small-16/panel-text/full | 8.697 ± 0.077 | 8.541 ± 0.074 | 1.018× |
| small-16/panel-text/background | 0.262 ± 0.002 | 0.268 ± 0.004 | 0.977× |
| small-16/panel-text/color | 0.220 ± 0.002 | 0.224 ± 0.000 | 0.985× |
| small-16/panel-text/opacity | 6.649 ± 0.061 | 6.355 ± 0.061 | 1.046× |
| small-16/panel-text/pointerEvents | 0.040 ± 0.000 | 0.037 ± 0.000 | 1.070× |
| wide-1024/panel/full | 209.452 ± 0.190 | 208.910 ± 2.235 | 1.003× |
| wide-1024/panel/background | 0.265 ± 0.001 | 0.271 ± 0.004 | 0.980× |
| wide-1024/panel/opacity | 258.726 ± 3.208 | 259.771 ± 1.897 | 0.996× |
| wide-1024/panel/pointerEvents | 0.040 ± 0.000 | 0.041 ± 0.000 | 0.995× |
| wide-1024/panel-text/full | 614.769 ± 8.274 | 602.454 ± 1.815 | 1.020× |
| wide-1024/panel-text/background | 0.271 ± 0.001 | 0.279 ± 0.003 | 0.972× |
| wide-1024/panel-text/color | 0.224 ± 0.003 | 0.235 ± 0.001 | 0.955× |
| wide-1024/panel-text/opacity | 420.470 ± 1.428 | 406.678 ± 1.896 | 1.034× |
| wide-1024/panel-text/pointerEvents | 0.042 ± 0.000 | 0.042 ± 0.000 | 0.998× |
| chain-256/panel/full | 242.732 ± 2.349 | 57.414 ± 0.535 | 4.228× |
| chain-256/panel/background | 1.989 ± 0.013 | 1.414 ± 0.007 | 1.407× |
| chain-256/panel/opacity | 256.513 ± 1.441 | 72.026 ± 0.055 | 3.561× |
| chain-256/panel/pointerEvents | 0.261 ± 0.003 | 0.258 ± 0.002 | 1.012× |
| chain-256/panel-text/full | 516.208 ± 2.862 | 152.806 ± 0.371 | 3.378× |
| chain-256/panel-text/background | 1.983 ± 0.029 | 1.404 ± 0.022 | 1.413× |
| chain-256/panel-text/color | 1.950 ± 0.035 | 1.371 ± 0.001 | 1.423× |
| chain-256/panel-text/opacity | 480.502 ± 3.470 | 108.589 ± 0.365 | 4.425× |
| chain-256/panel-text/pointerEvents | 0.261 ± 0.001 | 0.258 ± 0.004 | 1.012× |
| chain-512/panel/full | 960.743 ± 6.078 | 116.743 ± 0.379 | 8.230× |
| chain-512/panel/background | 4.654 ± 0.027 | 3.545 ± 0.024 | 1.313× |
| chain-512/panel/opacity | 983.839 ± 9.392 | 140.503 ± 0.881 | 7.002× |
| chain-512/panel/pointerEvents | 0.479 ± 0.003 | 0.476 ± 0.003 | 1.006× |
| chain-512/panel-text/full | 2062.558 ± 13.194 | 310.983 ± 0.708 | 6.632× |
| chain-512/panel-text/background | 4.662 ± 0.016 | 3.555 ± 0.040 | 1.311× |
| chain-512/panel-text/color | 4.589 ± 0.044 | 3.472 ± 0.052 | 1.322× |
| chain-512/panel-text/opacity | 1905.443 ± 19.326 | 213.577 ± 0.680 | 8.922× |
| chain-512/panel-text/pointerEvents | 0.475 ± 0.007 | 0.474 ± 0.004 | 1.002× |

Las actualizaciones profundas completas o de opacidad heredada mejoran entre 3,38× y 8,92×. Los cambios locales profundos mejoran aproximadamente entre 1,31× y 1,42×. Todas las comparaciones de contenido y transferencias de los 36 escenarios coinciden.

La mejora no es uniforme: varios cambios locales superficiales conservan una penalización aproximada de 4–11 ns por actualización (hasta alrededor del 5 %); el panel completo pequeño añade unos 0,05 µs. Los escenarios pequeños y anchos completos o heredados están cerca de la base o mejoran. Estas diferencias se publican, sin afirmar que desaparezca toda regresión pequeña ni extrapolar los resultados a FPS.

## Regresiones CPU

232 pruebas pasan, con 1.410 aserciones, en las suites del renderer, ciclo de vida de métricas, API y eventos. Incluyen Yoga real, copias de bytes GPU, equivalencia entera y fraccional, intersecciones vacías, una cadena de 20.000 nodos, recuentos por contexto, detach/reinsert, clamp de scroll y hit testing antes del siguiente render. Recolorear 1.000 glifos sigue escribiendo solo un run de 112 B.

Para ejecutarlas sin cargar Playwright ni modificar la infraestructura:

```sh
python3 - <<'CPU_TESTS'
from pathlib import Path
import subprocess
import tempfile

repo = Path.cwd()
run = Path(tempfile.mkdtemp(prefix='uno-metrics-cpu.'))
(run / 'tests').mkdir()
(run / 'src').symlink_to(repo / 'src')
(run / 'node_modules').symlink_to(repo / 'node_modules')
(run / 'tests/utils').symlink_to(repo / 'tests/utils')
names = [
    'renderer-webgpu.test.ts', 'renderer-metrics-lifecycle.test.ts',
    'api.test.ts', 'events-core.test.ts',
]
for name in names:
    content = (repo / 'tests' / name).read_text()
    (run / 'tests' / name).write_text(
        content.replace("from '@playwright/test'", "from 'bun:test'")
    )
subprocess.run(['bun', 'test', *['tests/' + name for name in names]], cwd=run, check=True)
CPU_TESTS
```

La llamada privada de la prueba de estilos `unset` también se adaptó al resolver; se comprobó su sintaxis TypeScript, sin ejecutar su prueba de navegador. No se ejecutaron Playwright, servidores ni validaciones visuales.
