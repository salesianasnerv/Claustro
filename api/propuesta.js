// Recibe las propuestas del formulario del portal y las envía por correo con Resend (resend.com).
// En Vercel hay que crear la variable de entorno RESEND_API_KEY con la clave de Resend.
// Opcional: PROPUESTAS_PARA (correo de destino) y PROPUESTAS_DE (remitente, si se verifica un dominio en Resend).

const PARA = process.env.PROPUESTAS_PARA || "web@nervion.salesianas.org";
const DE = process.env.PROPUESTAS_DE || "Portal del profesorado <onboarding@resend.dev>";
const SECCIONES = { general: "General", pastoral: "Pastoral", etapas: "Por etapas", equipos: "Por equipos", otros: "Otros" };
const MAX_BYTES = 3 * 1024 * 1024;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const texto = (v, max) => String(v ?? "").trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido." });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Falta configurar el envío (RESEND_API_KEY)." });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (b._honey) return res.status(200).json({ ok: true }); // trampa para robots

  const nombre = texto(b.nombre, 120);
  const correo = texto(b.correo, 160);
  const seccion = SECCIONES[b.seccion];
  const utilidad = b.seccion === "otros" ? "" : texto(b.utilidad, 120);
  const propuesta = texto(b.texto, 8000);
  if (!nombre || !seccion || !propuesta || (b.seccion !== "otros" && !utilidad)) {
    return res.status(400).json({ ok: false, error: "Faltan campos obligatorios." });
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ ok: false, error: "El correo no parece válido." });
  }

  const adjuntos = [];
  if (b.adjunto && b.adjunto.contenido) {
    const { nombre: fNombre, tipo, contenido } = b.adjunto;
    if (!/^image\/|\/pdf$/.test(tipo || "")) return res.status(400).json({ ok: false, error: "El adjunto debe ser una imagen o un PDF." });
    if (Buffer.byteLength(contenido, "base64") > MAX_BYTES) return res.status(400).json({ ok: false, error: "El adjunto no puede pasar de 3 MB." });
    adjuntos.push({ filename: texto(fNombre, 150) || "adjunto", content: contenido });
  }

  const asunto = `Formularios | [UTILIDADES] [${seccion}]` + (utilidad ? ` [${utilidad}]` : "");
  const filas = [
    ["Nombre y apellidos", nombre],
    ["Correo", correo || "(no indicado)"],
    ["Sección", seccion],
    ["Utilidad", utilidad || "—"],
    ["Propuesta", propuesta],
    ["Adjunto", adjuntos.length ? adjuntos[0].filename : "—"],
  ];
  const html = `<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
    ${filas.map(([k, v]) => `<tr><th align="left" valign="top" style="border:1px solid #ddd;background:#f3f7f9">${k}</th>
      <td style="border:1px solid #ddd;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}
  </table>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: DE,
        to: [PARA],
        subject: asunto,
        html,
        text: filas.map(([k, v]) => `${k}: ${v}`).join("\n"),
        ...(correo ? { reply_to: correo } : {}),
        ...(adjuntos.length ? { attachments: adjuntos } : {}),
      }),
    });
    if (!r.ok) {
      console.error("Resend", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "El servicio de correo no ha aceptado el envío." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "No se ha podido conectar con el servicio de correo." });
  }
};
