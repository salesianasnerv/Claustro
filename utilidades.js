/*
  LISTA DE UTILIDADES DEL PORTAL
  ------------------------------
  Para añadir una utilidad, copia un bloque { ... } y cambia los datos.

  - titulo:      nombre que aparece en la tarjeta.
  - descripcion: una frase corta.
  - url:         dirección completa (https://...).
  - icono:       uno de estos: pastoral, wc, calendario, documento, personas,
                 reloj, libro, grafica, enlace.
  - etiqueta:    (opcional) texto pequeño, p. ej. "Nuevo".

  Las ETAPAS aparecen en el orden en que están escritas. Para crear una etapa
  nueva (p. ej. Infantil o Primaria), copia un bloque de etapa completo.
*/

window.PORTAL = {
  curso: "2026-2027",

  general: [
    {
      titulo: "Pastoral",
      descripcion: "Lema, Buenos días, Bocadillo Solidario y otras propuestas de Pastoral.",
      url: "https://pastoral-claustro.vercel.app/",
      icono: "pastoral",
    },
  ],

  etapas: [
    {
      nombre: "ESO y Bachillerato",
      utilidades: [
        {
          titulo: "Control de baños",
          descripcion: "Registro de las salidas al baño del alumnado e informes por clase, franjas horarias o alumno/a.",
          url: "https://control-wc.vercel.app/",
          icono: "wc",
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
