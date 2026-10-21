// Avisos por correo de la web de Incidencias (incidencias-nervion.vercel.app), con la misma cuenta de Resend
// que las propuestas (api/propuesta.js): misma clave RESEND_API_KEY y mismo remitente.
// La llama la base de datos de Supabase (Incidencias/supabase/avisos.sql) cuando se crea una incidencia,
// cambia de estado o recibe un comentario, con los datos y a quién habría que avisar («para»).
//
// · Sin dominio verificado en Resend (como ahora): todos los avisos llegan a web@nervion.salesianas.org,
//   con el asunto «Incidencias | [Categoría] [Nueva/Estado/Comentario] #0012 · Título» y, dentro, a quién
//   va dirigido. Desde ese buzón, reglas de Outlook pueden reenviar cada categoría a su técnico.
// · Con dominio verificado: se pone PROPUESTAS_DE (o AVISOS_DE) con ese dominio y AVISOS_SECRETO (la misma
//   clave que en Supabase), y cada aviso va directamente a las personas de «para».
// Opcional: AVISOS_PARA (buzón central, por defecto el de las propuestas) y AVISOS_PRUEBA=si (no envía nada).

const crypto = require("crypto");

const CENTRAL = process.env.AVISOS_PARA || process.env.PROPUESTAS_PARA || "web@nervion.salesianas.org";
const DE_PROPIO = process.env.AVISOS_DE || process.env.PROPUESTAS_DE || "";
const DE = DE_PROPIO || "Incidencias <onboarding@resend.dev>";
const WEB = "https://incidencias-nervion.vercel.app";
const ESTADOS = { abierta: "Abierta", en_proceso: "En proceso", pausada: "Pausada (piezas)", cerrada: "Cerrada" };
const PRIOS = { baja: "Baja", media: "Media", alta: "Alta / crítica" };
const CATEGORIAS = { informatica: "Informática y tecnología", mobiliario: "Mobiliario y equipamiento", infraestructura: "Infraestructura y mantenimiento", fungibles: "Fungibles" };
const TIPOS = { creada: "Nueva", estado: "Estado", comentario: "Comentario" };
const COLORES = { abierta: "#009abb", en_proceso: "#ee712a", pausada: "#7a5195", cerrada: "#5f6b00" };

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const corto = (v, max) => String(v ?? "").trim().slice(0, max);
const num = (id) => "#" + String(id).padStart(4, "0");
const esCorreo = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const mismaClave = (a, b) => {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

function redactar(e, i, para, central) {
  const n = num(i.id), quien = corto(e.autor_nombre || e.autor, 120) || "Alguien", titulo = corto(i.titulo, 140);
  const categoria = CATEGORIAS[i.categoria] || corto(i.categoria, 60);
  const enlace = `${WEB}/#inc-${encodeURIComponent(i.id)}`;
  let frase, extra = "";
  if (e.tipo === "creada") frase = `${quien} ha creado una incidencia nueva.`;
  else if (e.tipo === "estado") frase = `${quien} ha cambiado el estado: ${ESTADOS[e.de] || e.de} → ${ESTADOS[e.a] || e.a}.`;
  else { frase = `${quien} ha comentado:`; extra = corto(e.texto, 4000); }

  const asunto = `Incidencias | [${categoria}] [${TIPOS[e.tipo] || e.tipo}] ${n} · ${titulo}`.slice(0, 200);
  const datos = [
    ...(central ? [["Avisar a", para.length ? para.join(", ") : "—"]] : []),
    ["Incidencia", `${n} · ${titulo}`],
    ["Estado", ESTADOS[i.estado] || i.estado],
    ["Prioridad asignada", PRIOS[i.prioridad] || i.prioridad],
    ["Urgencia indicada", PRIOS[i.urgencia || i.prioridad] || i.urgencia],
    ["Tipo", [categoria, corto(i.subcategoria, 80), (i.elementos || []).map((x) => corto(x, 60)).join(", ")].filter(Boolean).join(" › ")],
    ["Dónde", corto(i.ubicacion, 120) || "—"],
    ["Persona", corto(i.persona, 120)],
    ["Creada por", corto(i.creado_nombre || i.creado_por, 120)],
    ...(i.asignado_nombre ? [["Responsable", corto(i.asignado_nombre, 120)]] : []),
    ...(e.tipo === "creada" ? [["Descripción", corto(i.descripcion, 4000)]] : []),
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1d2a30;max-width:620px">
  <p style="font-size:15px;margin:0 0 12px">${esc(frase)}</p>
  ${extra ? `<blockquote style="margin:0 0 16px;padding:10px 14px;border-left:4px solid ${COLORES[i.estado] || "#009abb"};background:#f3f7f9;white-space:pre-wrap">${esc(extra)}</blockquote>` : ""}
  <table cellpadding="7" style="border-collapse:collapse;font-size:14px;width:100%">
    ${datos.map(([k, v]) => `<tr><th align="left" valign="top" style="border:1px solid #dde4e7;background:#f3f7f9;width:140px">${k}</th>
      <td style="border:1px solid #dde4e7;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}
  </table>
  <p style="margin:18px 0"><a href="${esc(enlace)}" style="background:#009abb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block">Abrir la incidencia</a></p>
  <p style="color:#6b7b82;font-size:12px;margin:0">Aviso automático de la web de Incidencias · Escuelas Salesianas María Auxiliadora · Nervión.</p>
</div>`;
  const texto = [frase, extra && `\n«${extra}»\n`, ...datos.map(([k, v]) => `${k}: ${v}`), "", `Abrir la incidencia: ${enlace}`].filter((x) => x !== "").join("\n");
  return { asunto, html, texto };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido." });
  // Con remitente propio se puede escribir a cualquiera: entonces la clave secreta es obligatoria.
  const directo = !!DE_PROPIO && !!process.env.AVISOS_SECRETO;
  if (process.env.AVISOS_SECRETO && !mismaClave(req.headers["x-avisos-secreto"], process.env.AVISOS_SECRETO)) {
    return res.status(401).json({ ok: false, error: "Clave secreta incorrecta." });
  }
  let b;
  try { b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}; }
  catch { return res.status(400).json({ ok: false, error: "Datos no válidos." }); }
  const e = b.evento, i = b.incidencia;
  if (!e || !i || !i.id || !TIPOS[e.tipo]) return res.status(400).json({ ok: false, error: "Faltan datos de la incidencia." });
  const para = [...new Set((b.para || []).map((x) => String(x).trim().toLowerCase()))].filter(esCorreo).slice(0, 50);
  if (!para.length) return res.status(200).json({ ok: true, enviados: 0 });

  const { asunto, html, texto } = redactar(e, i, para, !directo);
  const autor = String(e.autor || "").toLowerCase();
  const correo = { from: DE, to: directo ? para : [CENTRAL], subject: asunto, html, text: texto, ...(esCorreo(autor) ? { reply_to: autor } : {}) };

  if (process.env.AVISOS_PRUEBA === "si") return res.status(200).json({ ok: true, prueba: true, correo });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Falta configurar el envío (RESEND_API_KEY)." });
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(correo),
    });
    if (!r.ok) {
      console.error("Resend", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "El servicio de correo no ha aceptado el envío." });
    }
    return res.status(200).json({ ok: true, enviados: correo.to.length, modo: directo ? "directo" : "buzón central" });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "No se ha podido conectar con el servicio de correo." });
  }
};
