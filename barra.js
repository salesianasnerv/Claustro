/*
  BARRA «VOLVER AL PORTAL»
  ------------------------
  Cada web del colegio la carga con esta línea en su <head>:

    <script src="https://claustro-utilidades.vercel.app/barra.js" defer></script>

  Solo aparece si se ha llegado a la web desde el portal (y sigue apareciendo en esa
  pestaña aunque se cambie de página o se inicie sesión). Si se entra directamente, no sale.
  El título es lo que va antes de " | " en el <title> de la web; para poner otro,
  añade data-titulo="…" a la etiqueta <script>. Con data-sin-barra no pone la barra
  (solo el aviso de Teams); se usa en el panel y en las páginas de imprimir.

  Además, dentro de una pestaña de Teams (que no deja imprimir) cambia los botones de imprimir: ver abajo.
*/
(function () {
  const yo = document.currentScript;
  if (!yo || window !== window.top || yo.hasAttribute("data-sin-barra")) return;
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

/*
  IMPRIMIR DESDE TEAMS 
  Dentro de una pestaña de Teams el navegador no deja abrir la ventana de imprimir.
  Si la web está dentro de Teams, el botón «Imprimir» / «Guardar como PDF» enseña un aviso
  con el botón «Abrir en el navegador», que abre la misma página fuera de Teams.
*/
(function () {
  if (window === window.top) return;
  const TEAMS = /(^|\.)teams\.(microsoft|live)\.com$|(^|\.)teams\.cloud\.microsoft$|(^|\.)cloud\.microsoft$/;
  let padres = [];
  try { padres = Array.from(location.ancestorOrigins || []); } catch {}
  try { if (document.referrer) padres.push(new URL(document.referrer).origin); } catch {}
  const enTeams = padres.some((o) => { try { return TEAMS.test(new URL(o).hostname); } catch { return false; } })
    || new URLSearchParams(location.search).has("teams") || /\bTeams\//.test(navigator.userAgent);
  if (!enTeams) return;

  // La letra corporativa, por si la web no la ha cargado ya
  function letra() {
    if (document.querySelector('link[href*="family=Fira+Sans"]')) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600;700&display=swap";
    document.head.appendChild(l);
  }
  if (document.head) letra(); else document.addEventListener("DOMContentLoaded", letra);

  function aviso() {
    if (document.getElementById("aviso-imprimir-teams")) return;
    const url = new URL(location.href); url.searchParams.delete("teams");
    const host = document.createElement("div");
    host.id = "aviso-imprimir-teams";
    const s = host.attachShadow({ mode: "open" });
    s.innerHTML = `
      <style>
        :host { all: initial; position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
          background: rgba(15, 23, 42, .45); font: 400 15px/1.45 "Fira Sans", system-ui, sans-serif; }
        .caja { --panel: #fff; --texto: #1E293B; --suave: #64748B; --borde: #E2E8F0; --azul: #009abb;
          position: relative; overflow: hidden; width: min(420px, calc(100vw - 32px)); padding: 22px 22px 26px;
          border-radius: 14px; background: var(--panel); color: var(--texto); box-shadow: 0 20px 50px rgba(0,0,0,.25); }
        @media (prefers-color-scheme: dark) { .caja { --panel: #17212C; --texto: #E7ECF2; --suave: #9AA8B6; --borde: #263340; --azul: #29b6d4; } }
        .caja::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px;
          background: linear-gradient(90deg, #009abb 0 33.34%, #b4be00 33.34% 66.67%, #ee712a 66.67%); }
        h2 { margin: 0 0 8px; font: 700 18px/1.3 "Fira Sans", system-ui, sans-serif; }
        p { margin: 0 0 18px; color: var(--suave); }
        .acc { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
        a, button { font: 600 14px/1 "Fira Sans", system-ui, sans-serif; padding: 10px 16px; border-radius: 999px; cursor: pointer; text-decoration: none; }
        button { background: none; border: 1px solid var(--borde); color: inherit; }
        a { background: var(--azul); border: 1px solid var(--azul); color: #fff; }
      </style>
      <div class="caja" role="dialog" aria-modal="true" aria-labelledby="t">
        <h2 id="t">Para imprimir, abre la web en el navegador</h2>
        <p>Teams no deja imprimir ni guardar en PDF desde sus pestañas. Pulsa «Abrir en el navegador», vuelve a pulsar el botón de imprimir allí y elige la impresora o «Guardar como PDF».</p>
        <div class="acc"><button type="button">Cerrar</button><a href="${url.href}" target="_blank" rel="noopener">Abrir en el navegador</a></div>
      </div>`;
    const cerrar = () => host.remove();
    s.querySelector("button").onclick = cerrar;
    s.querySelector("a").addEventListener("click", () => setTimeout(cerrar, 300));
    host.addEventListener("click", (e) => { if (e.target === host) cerrar(); });
    document.body.appendChild(host);
    s.querySelector("a").focus();
  }
  window.print = aviso;
})();
