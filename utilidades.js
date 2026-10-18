/*
  LISTA DE UTILIDADES DEL PORTAL
  ------------------------------
  Para añadir una utilidad, copia un bloque { ... } y cambia los datos.

  - titulo:      nombre que aparece en la tarjeta.
  - descripcion: una frase corta.
  - url:         dirección completa (https://...).
  - icono:       uno de estos: pastoral, estrella, sol, corazon, wc, calendario,
                 documento, personas, reloj, libro, grafica, reserva, carpeta, correo, enlace.
  - etiqueta:    (opcional) texto pequeño, p. ej. "Nuevo".
                 Para poner varias: ["ESO", "Bachillerato"].

  Hay tres apartados: general, pastoral y etapas.
  GENERAL está dividido en grupos (Enlaces y Utilidades): cada utilidad va
  dentro del grupo que le corresponda, en el orden en que quieras que salga.
  Las ETAPAS aparecen en el orden en que están escritas. Para crear una etapa
  nueva (p. ej. Infantil o Primaria), copia un bloque de etapa completo.
*/

window.PORTAL = {
  curso: "2026-2027",

  // General se divide en grupos; aparecen en el orden en que están escritos.
  general: [
    {
      nombre: "Enlaces",
      utilidades: [
        {
          titulo: "Outlook",
          descripcion: "Correo del colegio (cuenta @salesianas.org).",
          url: "https://outlook.office.com/mail/",
          icono: "correo",
        },
        {
          titulo: "SharePoint",
          descripcion: "Sitio del colegio en SharePoint: documentos y carpetas compartidas del claustro.",
          url: "https://salesianas.sharepoint.com/sites/E-NER",
          icono: "carpeta",
        },
      ],
    },
    {
      nombre: "Utilidades",
      utilidades: [
        {
          titulo: "Calendario",
          descripcion: "Calendario del curso por meses, con filtros por etapa y suscripción en el móvil.",
          url: "https://calendario-nervion.vercel.app/",
          icono: "calendario",
        },
        {
          titulo: "Reserva de espacios",
          descripcion: "Reserva de aulas, espacios, iPads y portátiles del colegio.",
          url: "https://reserva-espacios.vercel.app/",
          icono: "reserva",
        },
        {
          titulo: "Biblioteca",
          descripcion: "Catálogo, reservas y préstamos de libros de la biblioteca del colegio.",
          url: "https://biblioteca-nervion.vercel.app/",
          icono: "libro",
        },
        {
          titulo: "PAC",
          descripcion: "Plan Anual de Centro: cada equipo redacta sus apartados y se descarga en PDF o Word.",
          url: "https://pac-nervion.vercel.app/",
          icono: "documento",
        },
      ],
    },
  ],

  // La primera es la web de Pastoral completa; las demás aparecen debajo,
  // como accesos directos a lo que hay dentro de ella.
  pastoral: [
    {
      titulo: "Pastoral | General",
      descripcion: "Lema, Buenos días, Bocadillo Solidario y otras propuestas de Pastoral.",
      url: "https://pastoral-claustro.vercel.app/",
      icono: "pastoral",
    },
    {
      titulo: "Lema del curso",
      descripcion: "«Aquí y ahora»: el lema, la canción y su sentido para este curso.",
      url: "https://salesianas.org/aqui-y-ahora/",
      icono: "estrella",
    },
    {
      titulo: "Buenos Días",
      descripcion: "Calendario y guías de los Buenos Días por etapas.",
      url: "https://pastoral-bbdd.vercel.app/",
      icono: "sol",
    },
    {
      titulo: "Bocadillo solidario",
      descripcion: "Recuento del Bocadillo solidario para tutores y responsables de Pastoral.",
      url: "https://pastoral-bocadillo.vercel.app/",
      icono: "corazon",
    },
  ],

  etapas: [
    {
      nombre: "ESO y Bachillerato",
      utilidades: [
        {
          titulo: "Horarios y sustituciones",
          descripcion: "Sustituciones y avisos del día, dónde está cada compañero/a, horarios de profesorado y grupos, y recreos.",
          url: "https://horarios-nervion.vercel.app/",
          icono: "reloj",
          etiqueta: ["ESO", "Bachillerato"],
        },
        {
          titulo: "Control de baños",
          descripcion: "Registro de las salidas al baño del alumnado e informes por clase, franjas horarias o alumno/a.",
          url: "https://control-wc.vercel.app/",
          icono: "wc",
          etiqueta: ["ESO", "Bachillerato"],
        },
        {
          titulo: "Orientación",
          descripcion: "Atención a la diversidad: alumnado con seguimiento, medidas, proceso de derivación, plantillas y recursos.",
          url: "https://orientacion-nervion.vercel.app/",
          icono: "personas",
          etiqueta: "ESO",
        },
        {
          titulo: "Calendario de exámenes",
          descripcion: "Calendario de exámenes de Bachillerato para el profesorado.",
          url: "https://bachillerato-profesorado.vercel.app/",
          icono: "calendario",
          etiqueta: "Bachillerato",
        },
      ],
    },
  ],
};
