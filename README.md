# Utilidades del profesorado

Portal que reúne en un solo sitio las utilidades del claustro de las Escuelas Salesianas María Auxiliadora.

- **General**: utilidades para todo el claustro (Pastoral…).
- **Por etapa**: utilidades propias de cada etapa (ESO y Bachillerato…).

## Añadir o cambiar una utilidad

Solo hay que editar `utilidades.js` (las instrucciones están al principio del archivo). En GitHub: abre el archivo, pulsa el lápiz ✏️, haz el cambio y pulsa *Commit changes*. Vercel publica la nueva versión sola en un minuto.

## Archivos

- `index.html`, `styles.css`, `app.js`: la web (normalmente no hace falta tocarlos).
- `utilidades.js`: la lista de utilidades.
- `logo.svg`, `icon-*.png`, `favicon-*.png`, `favicon.ico`: logo e iconos (pestaña del navegador, app en el móvil).
- `manifest.json`, `sw.js`: permiten instalar el portal como app (PWA) y abrirlo sin conexión.
- `og-image.png`: imagen que aparece al compartir el enlace por WhatsApp, Teams, correo o redes. Si la web se publica en una dirección distinta de `utilidades-profesorado.vercel.app`, hay que cambiarla en `index.html` (líneas con `og:` y `twitter:`).
