// Dibuja el portal a partir de utilidades.js. Normalmente no hace falta tocar este archivo.
(function () {
  const P = window.PORTAL;
  const $ = (id) => document.getElementById(id);

  const ICONOS = {
    pastoral: '<path d="M12 3v18M7 8h10"/>',
    estrella: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    wc: '<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M5 21v-6H4l1.5-7h3L10 15H9v6M15 21v-8h-1V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4h-1v8"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
    documento: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    personas: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5 5.8"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    libro: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    grafica: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-");

  function tarjeta(u, tono) {
    const host = (() => { try { return new URL(u.url).host; } catch { return ""; } })();
    // etiqueta puede ser un texto ("Bachillerato") o una lista (["ESO", "Bachillerato"])
    const etqs = [].concat(u.etiqueta || []);
    return `<a class="util tono-${tono}" href="${esc(u.url)}" target="_blank" rel="noopener"
        data-texto="${esc(norm(u.titulo + " " + u.descripcion + " " + etqs.join(" ")))}">
      <span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[u.icono] || ICONOS.enlace}</svg></span>
      <span class="cuerpo">
        <span class="titulo">${esc(u.titulo)}</span>
        ${etqs.length ? `<span class="etqs">${etqs.map((e) => `<span class="etq">${esc(e)}</span>`).join("")}</span>` : ""}
        <span class="desc">${esc(u.descripcion)}</span>
        <span class="host">${esc(host)}</span>
      </span>
      <svg class="flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
    </a>`;
  }

  $("curso").textContent = P.curso;
  $("general").innerHTML = P.general.map((u) => tarjeta(u, "general")).join("");
  // Pastoral: la primera es la web completa; el resto son accesos directos a lo que hay dentro de ella
  const [pasWeb, ...pasDentro] = P.pastoral || [];
  $("pastoral").innerHTML = pasWeb ? `
    <div class="rejilla principal">${tarjeta(pasWeb, "pastoral")}</div>
    ${pasDentro.length ? `<div class="dentro">
      <p class="dentro-t">Dentro de la web de Pastoral · accesos directos</p>
      <div class="rejilla">${pasDentro.map((u) => tarjeta(u, "pastoral")).join("")}</div>
    </div>` : ""}` : "";

  $("etapas").innerHTML = P.etapas.map((e) => `
    <div class="etapa" data-etapa="${slug(e.nombre)}">
      <h3>${esc(e.nombre)}</h3>
      <div class="rejilla">${e.utilidades.map((u) => tarjeta(u, "etapa")).join("")}</div>
    </div>`).join("");

  // Selector de etapa: solo tiene sentido si hay más de una
  let etapaSel = "todas";
  try { etapaSel = localStorage.getItem("portal-etapa") || "todas"; } catch {}
  if (!P.etapas.some((e) => slug(e.nombre) === etapaSel)) etapaSel = "todas";

  const chips = $("chips");
  if (P.etapas.length > 1) {
    chips.innerHTML = [["todas", "Todas"], ...P.etapas.map((e) => [slug(e.nombre), e.nombre])]
      .map(([k, n]) => `<button type="button" data-k="${k}">${esc(n)}</button>`).join("");
    chips.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      etapaSel = b.dataset.k;
      try { localStorage.setItem("portal-etapa", etapaSel); } catch {}
      filtrar();
    });
  } else {
    chips.hidden = true;
  }

  function filtrar() {
    const q = norm($("buscar").value.trim());
    let total = 0;
    document.querySelectorAll(".util").forEach((a) => {
      const ok = !q || a.dataset.texto.includes(q);
      a.hidden = !ok;
    });
    chips.querySelectorAll("button").forEach((b) => b.classList.toggle("activa", b.dataset.k === etapaSel));
    document.querySelectorAll("#etapas > .etapa").forEach((d) => {
      const visibles = d.querySelectorAll(".util:not([hidden])").length;
      d.hidden = (etapaSel !== "todas" && d.dataset.etapa !== etapaSel) || visibles === 0;
      if (!d.hidden) total += visibles;
    });
    const nGen = $("general").querySelectorAll(".util:not([hidden])").length;
    const nPas = $("pastoral").querySelectorAll(".util:not([hidden])").length;
    $("apGeneral").hidden = nGen === 0;
    $("apPastoral").hidden = nPas === 0;
    document.querySelectorAll("#pastoral .dentro").forEach((d) => { d.hidden = !d.querySelector(".util:not([hidden])"); });
    $("apEtapas").hidden = total === 0 && !!q;
    $("vacio").hidden = nGen + nPas + total > 0;
  }

  $("buscar").addEventListener("input", filtrar);
  filtrar();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
