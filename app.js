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
    reserva: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/>',
    carpeta: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="1.6"/><path d="M8.8 16.5a3.4 3.4 0 0 1 6.4 0"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
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
  $("general").innerHTML = P.general.map((g) => `
    <div class="grupo">
      <h3>${esc(g.nombre)}</h3>
      <div class="rejilla">${g.utilidades.map((u) => tarjeta(u, "general")).join("")}</div>
    </div>`).join("");
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
    document.querySelectorAll("#general > .grupo").forEach((g) => { g.hidden = !g.querySelector(".util:not([hidden])"); });
    document.querySelectorAll("#pastoral .dentro").forEach((d) => { d.hidden = !d.querySelector(".util:not([hidden])"); });
    $("apEtapas").hidden = total === 0 && !!q;
    $("vacio").hidden = nGen + nPas + total > 0;
    document.querySelectorAll("#saltos a").forEach((a) => { a.hidden = document.querySelector(a.getAttribute("href")).hidden; });
  }

  $("buscar").addEventListener("input", filtrar);
  filtrar();

  // Formulario de propuestas: el desplegable "Utilidad" cambia según la sección elegida
  const SECCIONES = {
    general: { nombre: "General", grupos: P.general.map((g) => [g.nombre, g.utilidades]) },
    pastoral: { nombre: "Pastoral", grupos: [["", P.pastoral || []]] },
    etapas: { nombre: "Por etapas", grupos: P.etapas.map((e) => [e.nombre, e.utilidades]) },
    equipos: { nombre: "Por equipos", grupos: [["", P.equipos || []]] },
    otros: { nombre: "Otros", grupos: [] },
  };
  const OTRA = "Otra / nueva utilidad";
  const form = $("formProp"), selSec = $("propSeccion"), selUtil = $("propUtil"), aviso = $("propAviso");

  selSec.addEventListener("change", () => {
    const s = SECCIONES[selSec.value];
    const hay = s && selSec.value !== "otros";
    $("campoUtil").hidden = !hay;
    selUtil.required = hay;
    if (!hay) { selUtil.innerHTML = ""; return; }
    const opc = (u) => `<option>${esc(u.titulo)}</option>`;
    selUtil.innerHTML = `<option value="" disabled selected>Elige una utilidad…</option>` +
      s.grupos.filter(([, us]) => us.length).map(([n, us]) => n
        ? `<optgroup label="${esc(n)}">${us.map(opc).join("")}</optgroup>` : us.map(opc).join("")).join("") +
      `<option>${OTRA}</option>`;
  });

  function avisar(texto, tipo) { aviso.textContent = texto; aviso.className = "aviso " + (tipo || ""); }

  const MAX_MB = 3;
  const archivo = $("propArchivo");
  const tamano = (b) => b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const leerBase64 = (f) => new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.onerror = mal;
    r.readAsDataURL(f);
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d._honey) return;
    const falta = [...form.querySelectorAll("[required]")].find((c) => !c.value.trim());
    if (falta) { falta.focus(); return avisar("Rellena los campos obligatorios.", "error"); }
    if (d.correo && !form.correo.checkValidity()) { form.correo.focus(); return avisar("El correo no parece válido.", "error"); }
    const f = archivo.files[0];
    if (f && !/^image\/|\/pdf$/.test(f.type)) { archivo.focus(); return avisar("El adjunto debe ser una imagen o un PDF.", "error"); }
    if (f && f.size > MAX_MB * 1048576) { archivo.focus(); return avisar(`El adjunto no puede pasar de ${MAX_MB} MB.`, "error"); }

    const sec = SECCIONES[d.seccion].nombre;
    const asunto = `Formularios | [UTILIDADES] [${sec}]` + (d.utilidad ? ` [${d.utilidad}]` : "");
    const cfg = P.propuestas || {};

    if (cfg.prueba) {
      const vista = {
        "Nombre y apellidos": d.nombre.trim(), "Correo": d.correo.trim() || "(no indicado)", "Sección": sec,
        "Utilidad": d.utilidad || "—", "Propuesta": d.texto.trim(), "Adjunto": f ? `${f.name} (${tamano(f.size)})` : "—",
      };
      $("propPrueba")?.remove();
      form.insertAdjacentHTML("afterend", `<div class="prueba" id="propPrueba">
        <p class="prueba-t">Modo prueba · no se ha enviado nada. Este es el correo que llegaría a ${esc(cfg.correo)}:</p>
        <p><strong>Asunto:</strong> ${esc(asunto)}</p>
        <dl>${Object.entries(vista).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      </div>`);
      return avisar("Vista previa generada (modo prueba).", "ok");
    }

    // El correo lo envía el propio portal (api/propuesta.js en Vercel)
    const btn = $("propEnviar");
    btn.disabled = true;
    avisar("Enviando…");
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), 25000);
    try {
      const datos = {
        nombre: d.nombre, correo: d.correo, seccion: d.seccion, utilidad: d.utilidad || "", texto: d.texto, _honey: d._honey,
        adjunto: f ? { nombre: f.name, tipo: f.type, contenido: await leerBase64(f) } : null,
      };
      const r = await fetch("api/propuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
        signal: corte.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "");
      form.reset();
      selSec.dispatchEvent(new Event("change"));
      avisar("¡Gracias! Tu propuesta se ha enviado.", "ok");
    } catch (err) {
      const motivo = err.name === "AbortError" ? "El envío ha tardado demasiado." : (err.message || "No se ha podido enviar.");
      avisar(`${motivo} Inténtalo de nuevo o escribe a ${cfg.correo}.`, "error");
    } finally {
      clearTimeout(reloj);
      btn.disabled = false;
    }
  });

  // Botones para ir a cada sección: se quedan fijos bajo la cabecera y marcan la sección en la que estás
  const saltos = $("saltos");
  const enlaces = [...saltos.querySelectorAll("a")];
  const fijarAltura = () => document.documentElement.style.setProperty("--cab", document.querySelector(".top").offsetHeight + "px");
  fijarAltura();
  addEventListener("resize", fijarAltura);

  // Tras pulsar un botón, se queda marcado hasta que la persona vuelva a desplazarse por su cuenta
  let elegido = null;
  const soltar = () => { elegido = null; };
  ["wheel", "touchmove", "keydown"].forEach((t) => addEventListener(t, soltar, { passive: true }));

  saltos.addEventListener("click", (ev) => {
    const a = ev.target.closest("a"); if (!a) return;
    elegido = a;
    marcarActivo();
    const destino = document.querySelector(a.getAttribute("href"));
    if (a.getAttribute("href") === "#apPropuestas") destino.querySelector("details").open = true;
  });

  function marcarActivo() {
    const linea = document.querySelector(".top").offsetHeight + saltos.offsetHeight + 24;
    let activo = null;
    for (const a of enlaces) {
      const s = document.querySelector(a.getAttribute("href"));
      if (!s.hidden && s.getBoundingClientRect().top <= linea) activo = a;
    }
    // Al llegar al final de la página, la última sección visible
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) activo = enlaces.filter((a) => !a.hidden).pop();
    if (elegido && !elegido.hidden) activo = elegido;
    enlaces.forEach((a) => a.classList.toggle("activa", a === activo));
    saltos.classList.toggle("pegado", saltos.getBoundingClientRect().top <= document.querySelector(".top").offsetHeight + 1);
  }
  addEventListener("scroll", marcarActivo, { passive: true });
  $("buscar").addEventListener("input", marcarActivo);
  marcarActivo();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
