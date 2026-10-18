# Utilidades del profesorado

Portal que reúne en un solo sitio las utilidades del claustro de las Escuelas Salesianas María Auxiliadora.

- **General**: utilidades para todo el claustro (Pastoral…).
- **Por etapa**: utilidades propias de cada etapa (ESO y Bachillerato…).

## Añadir o cambiar una utilidad

Solo hay que editar `utilidades.js` (las instrucciones están al principio del archivo). En GitHub: abre el archivo, pulsa el lápiz ✏️, haz el cambio y pulsa *Commit changes*. Vercel publica la nueva versión sola en un minuto.

## Formulario de propuestas

Al final del portal hay un bloque plegable para enviar propuestas (con adjunto opcional: imagen o PDF de hasta 3 MB). Llegan a `web@nervion.salesianas.org` con el asunto `Formularios | [UTILIDADES] [Sección] [Utilidad]`.

El correo lo envía el propio portal: `api/propuesta.js` es una función de Vercel que usa el servicio gratuito Resend (resend.com).

- **Configuración (una sola vez):** en Vercel → proyecto → *Settings* → *Environment Variables*, crear `RESEND_API_KEY` con la clave de Resend y volver a desplegar. La cuenta de Resend debe estar creada con `web@nervion.salesianas.org` (sin dominio verificado, Resend solo envía al correo de la cuenta).
- Opcional: `PROPUESTAS_PARA` (otro correo de destino) y `PROPUESTAS_DE` (remitente, si se verifica un dominio en Resend).
- Con `prueba: true` en `utilidades.js` (`propuestas`) no se envía nada y se ve en pantalla el correo que llegaría.
- Las webs de la sección «Por equipos» se añaden en `equipos` dentro de `utilidades.js`.

## Archivos

- `index.html`, `styles.css`, `app.js`: la web (normalmente no hace falta tocarlos).
- `utilidades.js`: la lista de utilidades.
- `logo.svg`, `icon-*.png`, `favicon-*.png`, `favicon.ico`: logo e iconos (pestaña del navegador, app en el móvil).
- `api/propuesta.js`: envía por correo las propuestas del formulario.
- `manifest.json`, `sw.js`: permiten instalar el portal como app (PWA) y abrirlo sin conexión.
- `og-image.png`: imagen que aparece al compartir el enlace por WhatsApp, Teams, correo o redes. Si la web se publica en una dirección distinta de `claustro-utilidades.vercel.app`, hay que cambiarla en `index.html` (líneas con `og:` y `twitter:`).
