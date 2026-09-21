# Portafolio de constelaciones

Primera versión con títulos provisionales, seis figuras y desplazamiento natural.

## Ejecutar

Requiere Node.js 22.12 o posterior compatible con Vite 7.

```sh
npm install
npm run dev
```

Abre la dirección que indique Vite. Para validar:

```sh
npm test
npm run build
npm run preview
```

## Orden de lectura y módulos

1. `package.json`: dependencias y comandos. Vite desarrolla y compila; React organiza la interfaz; Three.js dibuja; GSAP conecta el desplazamiento con la escena.
2. `index.html` y `src/main.jsx`: documento en español y punto de entrada. React monta App dentro de `#root`.
3. `src/content.js`: fuente única de títulos e identificadores. No contiene datos personales inventados.
4. `src/App.jsx`: secciones HTML, navegación por anclas y controles. Crea la escena una vez y libera los recursos al desmontar. Los títulos permanecen accesibles incluso si falla WebGL. La información de sensores no se almacena ni se envía.
5. `src/styles.css`: composición adaptable, contraste, tamaños, foco del teclado y controles táctiles. El canvas permanece fijo mientras el contenido se desplaza. La fuente externa tiene una alternativa sans-serif.
6. `src/scene/shapes.js`: calcula seis conjuntos de coordenadas XYZ. Cada estrella conserva su índice entre figuras. `morphInto` interpola entre figuras adyacentes y permite recorrer la transición en ambos sentidos.
7. `src/scene/createScene.js`: crea un solo renderer, cámara, partículas y líneas. ScrollTrigger convierte el recorrido del documento en un valor entre 0 y 5. Un bucle requestAnimationFrame actualiza las posiciones. Se limita la resolución y el número de partículas en móvil. Se pausa el renderizado con la pestaña oculta o el movimiento desactivado. La preferencia de movimiento reducido congela la escena sin ocultar contenido.
8. `src/scene/tilt.js`: solicita permiso desde una interacción, comprueba que lleguen valores válidos y toma la primera orientación como referencia. Limita la inclinación y ajusta los ejes según la orientación de pantalla. Sin permiso o datos conserva la navegación por scroll. La cámara recibe el movimiento suavizado desde createScene.
9. `src/scene/shapes.test.js`: comprobación ejecutable de posiciones finitas, extremos exactos, interpolación y reversibilidad.
10. `.github/workflows/deploy.yml`: instala desde el lockfile, prueba, compila y publica `dist` en GitHub Pages al actualizar `main`.

## Cómo se conectan

```text
index.html → main.jsx → App.jsx → content.js
                         ├─ styles.css
                         ├─ createScene.js → shapes.js
                         └─ tilt.js → createScene.setTilt()

Scroll → ScrollTrigger → progress (0..5) → morphInto() → Three.js
Sensor → calibración → límite → suavizado → rotación del grupo
```

## Parámetros para experimentar

- Color de las estrellas y líneas: materiales en `createScene.js`.
- Densidad: `count` en `createScene.js` (180 móvil / 360 escritorio).
- Sensibilidad: divisor 25 en `tilt.js` y factores 0.12 / 0.1 en `createScene.js`.
- Distribuciones: condiciones de `makeShapes` en `shapes.js`.
- Textos: `content.js`; marca y pie: `App.jsx`; metadatos: `index.html`.

Se utilizan enlaces dispersos predefinidos entre estrellas. Las partículas son puntos pequeños y las conexiones rectas; no hay filtros de brillo ni modelos 3D pesados. Los controles de movimiento están al pie. Contacto y proyectos son títulos provisionales: todavía no existen enlaces de contacto ni fichas reales.

## Publicar en GitHub Pages

1. Crea un repositorio público y sube el contenido de esta carpeta a su raíz, incluyendo `package-lock.json` y `.github`.
2. Utiliza la rama `main`.
3. En Settings → Pages → Build and deployment, selecciona GitHub Actions.
4. Ejecuta Publish portfolio desde Actions o sube un nuevo cambio.
5. Comprueba la dirección HTTPS que entrega GitHub antes de imprimir un QR.

`base: './'` permite cargar los recursos desde la raíz o desde el subdirectorio de un repositorio. La página usa anclas, por lo que no necesita un router ni reglas de redirección.

## Validación pendiente en dispositivos

La comprobación de geometría y la compilación no sustituyen una prueba visual. Revisa Safari en iPhone y Chrome en Android, permisos aceptados y rechazados, rotación de pantalla, zoom del texto y movimiento reducido. El acceso a sensores necesita HTTPS (el localhost de desarrollo tiene trato especial). Una dirección HTTP de la red local puede no permitir sensores.

El proyecto todavía no está publicado ni vinculado a una cuenta de GitHub.
