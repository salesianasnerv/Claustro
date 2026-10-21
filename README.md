# Utilidades del profesorado

Portal que reúne en un solo sitio las utilidades del claustro de las Escuelas Salesianas María Auxiliadora.

- **General**: utilidades para todo el claustro (Pastoral…).
- **Por etapa**: utilidades propias de cada etapa (ESO y Bachillerato…).

## Añadir o cambiar una utilidad

Solo hay que editar `utilidades.js` (las instrucciones están al principio del archivo). En GitHub: abre el archivo, pulsa el lápiz ✏️, haz el cambio y pulsa *Commit changes*. Vercel publica la nueva versión sola en un minuto.

Las utilidades se abren en la misma pestaña. Si una web no debe abrirse así (Outlook, SharePoint…), se le pone `externa: true` y se abre en una pestaña nueva.

## Barra «Volver al portal» en las demás webs

`barra.js` dibuja, arriba del todo de cada web del colegio, una barra con «← Volver al portal», el nombre de la web y las tres franjas de colores. **Solo aparece si se ha llegado a esa web desde el portal**; si se entra directamente (favoritos, Teams, un enlace…), no sale. Se mantiene en esa pestaña aunque se cambie de página o se inicie sesión.

Cada web la carga con una línea en su `<head>`:

```html
<script src="https://claustro-utilidades.vercel.app/barra.js" data-titulo="Nombre" defer></script>
```

`data-titulo` es opcional (si no se pone, se usa lo que va antes de « | » en el título de la página). Para cambiar la barra en todas las webs a la vez, basta con cambiar `barra.js` aquí.

## Formulario de propuestas

Al final del portal hay un bloque plegable para enviar propuestas (con adjunto opcional: imagen o PDF de hasta 3 MB). Llegan a `web@nervion.salesianas.org` con el asunto `Formularios | [UTILIDADES] [Sección] [Utilidad]`.

El correo lo envía el propio portal: `api/propuesta.js` es una función de Vercel que usa el servicio gratuito Resend (resend.com).

- **Configuración (una sola vez):** en Vercel → proyecto → *Settings* → *Environment Variables*, crear `RESEND_API_KEY` con la clave de Resend y volver a desplegar. La cuenta de Resend debe estar creada con `web@nervion.salesianas.org` (sin dominio verificado, Resend solo envía al correo de la cuenta).
- Opcional: `PROPUESTAS_PARA` (otro correo de destino) y `PROPUESTAS_DE` (remitente, si se verifica un dominio en Resend).
- Con `prueba: true` en `utilidades.js` (`propuestas`) no se envía nada y se ve en pantalla el correo que llegaría.
- Las webs de la sección «Por equipos» se añaden en `equipos` dentro de `utilidades.js`.

## Avisos de la web de Incidencias

`api/aviso-incidencia.js` aprovecha la misma cuenta de Resend que las propuestas (misma `RESEND_API_KEY`; remitente con el nombre «Incidencias · Utilidades»). La llama la base de datos de Incidencias (`Incidencias/supabase/avisos.sql`):

- **Nueva** → administración, con todos los datos.
- **Asignada** → el técnico, con la descripción completa.
- **Actualización** (estado, prioridad, responsable o comentario) → quien la creó.

Como Resend no tiene dominio verificado, **todos llegan a `web@nervion.salesianas.org`** con el asunto `PARA a@…;b@… | Incidencias | [Categoría] [Tipo] #0012 · Título`. Un flujo de Power Automate en ese buzón los reenvía a las direcciones de `PARA` (explicado en el README de Incidencias).

- Si un día se verifica un dominio en Resend: poner `PROPUESTAS_DE` (o `AVISOS_DE`) con ese dominio y `AVISOS_SECRETO` (la misma clave que en Supabase, tabla `inc_avisos_ajustes`); cada aviso irá directamente a las personas y el flujo deja de hacer falta.
- `AVISOS_PRUEBA=si` no envía nada y devuelve el correo que se enviaría.
- **Ojo:** este proyecto de Vercel no se publica solo al subir cambios a GitHub; hay que crear la publicación a mano (*Deployments → ⋯ → Create Deployment → main*).

## Archivos

- `index.html`, `styles.css`, `app.js`: la web (normalmente no hace falta tocarlos).
- `utilidades.js`: la lista de utilidades.
- `barra.js`: la barra «Volver al portal» que cargan las demás webs.
- `logo.svg`, `icon-*.png`, `favicon-*.png`, `favicon.ico`: logo e iconos (pestaña del navegador, app en el móvil).
- `api/propuesta.js`: envía por correo las propuestas del formulario.
- `manifest.json`, `sw.js`: permiten instalar el portal como app (PWA) y abrirlo sin conexión.
- `og-image.png`: imagen que aparece al compartir el enlace por WhatsApp, Teams, correo o redes. Si la web se publica en una dirección distinta de `claustro-utilidades.vercel.app`, hay que cambiarla en `index.html` (líneas con `og:` y `twitter:`).
