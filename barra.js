/*
  BARRA «VOLVER AL PORTAL»
  ------------------------
  Cada web del colegio la carga con esta línea en su <head>:

    <script src="https://claustro-utilidades.vercel.app/barra.js" defer></script>

  Solo aparece si se ha llegado a la web desde el portal (y sigue apareciendo en esa
  pestaña aunque se cambie de página o se inicie sesión). Si se entra directamente, no sale.
  El título es lo que va antes de " | " en el <title> de la web; para poner otro,
  añade data-titulo="…" a la etiqueta <script>.
*/
(function () {
  const yo = document.currentScript;
  if (!yo || window !== window.top) return;
  const PORTAL = new URL(yo.src).origin + "/";
  const CLAVE = "desde-portal";

  let origen = "";
  try { origen = new URL(document.referrer).origin + "/"; } catch {}
  const vieneAhora = origen === PORTAL;
  let activa = vieneAhora;
  try {
    if (vieneAhora) sessionStorage.setItem(CLAVE, "1");
    else activa = sessionStorage.getItem(CLAVE) === "1";
  } catch {}
  if (!activa) return;

  const titulo = yo.dataset.titulo || document.title.split(" | ")[0].trim();

  const host = document.createElement("div");
  host.id = "barra-portal";
  const sombra = host.attachShadow({ mode: "open" });
  sombra.innerHTML = `
    <style>
      :host { all: initial; display: block; position: relative; z-index: 20; }
      .barra { --panel: #fff; --texto: #1E293B; --borde: #E2E8F0; --azul: #009abb; --azul-bg: rgba(0, 154, 187, .11);
        position: relative; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;
        padding: 8px 16px 12px; background: var(--panel); color: var(--texto);
        font: 600 14px/1.3 "Fira Sans", system-ui, sans-serif; }
      @media (prefers-color-scheme: dark) {
        .barra { --panel: #17212C; --texto: #E7ECF2; --borde: #263340; --azul: #29b6d4; --azul-bg: rgba(41, 182, 212, .14); }
      }
      /* Tres franjas con los colores corporativos */
      .barra::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px;
        background: linear-gradient(90deg, #009abb 0 33.34%, #b4be00 33.34% 66.67%, #ee712a 66.67%); }
      a { justify-self: start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
        border: 1px solid var(--borde); border-radius: 999px; color: inherit; text-decoration: none;
        transition: border-color .15s, color .15s, background .15s; }
      a:hover { border-color: var(--azul); color: var(--azul); }
      a:focus-visible { outline: 3px solid var(--azul-bg); border-color: var(--azul); }
      svg { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 2;
        stroke-linecap: round; stroke-linejoin: round; }
      .t { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      @media (max-width: 520px) {
        .barra { padding: 6px 10px 10px; gap: 8px; }
        a { padding: 6px 10px; }
        a span { display: none; }
      }
    </style>
    <nav class="barra" aria-label="Portal del profesorado">
      <a href="${PORTAL}" title="Volver al portal de utilidades del profesorado">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span>Volver al portal</span>
      </a>
      <span class="t"></span>
    </nav>`;
  sombra.querySelector(".t").textContent = titulo;

  // Si se acaba de llegar desde el portal, se vuelve "Atrás" para recuperar el sitio exacto en el que se estaba
  sombra.querySelector("a").addEventListener("click", (ev) => {
    try { sessionStorage.removeItem(CLAVE); } catch {}
    if (vieneAhora && history.length > 1) { ev.preventDefault(); history.back(); }
  });

  const poner = () => document.body.prepend(host);
  if (document.body) poner(); else document.addEventListener("DOMContentLoaded", poner);
})();
