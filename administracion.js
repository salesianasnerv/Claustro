// Panel de Administración del portal: personal, cuentas compartidas, cursos y listas de alumnado, tutorías, reglas de Orientación y
// «quién puede hacer qué». Usa el Supabase común «Acceso Microsoft 365»; los permisos los comprueba la base de datos
// (es_admin_panel: grupo Equipo Directivo de Microsoft 365 o permiso «administracion»).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const SUPABASE_URL = 'https://hblayjaknhfxieqbzrlq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGF5amFrbmhmeGllcWJ6cmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjg0ODEsImV4cCI6MjEwNjgwNDQ4MX0.K2iWyQAt9upNBXUhdZuV-Nle9fkCMYgQ6jTBBO0MluE';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fecha = d => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const hoy = () => new Date().toISOString().slice(0, 10);
const aviso = (el, txt, ok = true) => { el.className = ok ? 'ok' : 'err'; el.textContent = txt; if (ok) setTimeout(() => { if (el.textContent === txt) el.textContent = ''; }, 3000); };

let grupos = {};        // clave de grupo de Microsoft 365 → nombre
let personal = [];
let tiposGrupo = {};    // clave de grupo → etapa, pas, cargo u otro
// Grupos de una persona, una línea por tipo: «Etapa: ESO, Bachillerato» / «Cargos: …» / «Otros: …»
function gruposEnLineas(claves) {
  const TIPOS = [['etapa', 'Etapa'], ['pas', 'PAS'], ['cargo', 'Cargos'], ['otro', 'Otros']];
  const lineas = TIPOS.map(([t, nombre]) => {
    const gs = claves.filter(k => (tiposGrupo[k] || 'otro') === t).map(k => grupos[k] || k).sort((a, b) => a.localeCompare(b, 'es'));
    return gs.length ? `<div class="g-linea"><span class="g-tipo">${nombre}</span> ${gs.map(esc).join(', ')}</div>` : '';
  }).join('');
  return lineas || '<span class="adm-nota">Ninguno</span>';
}

/* ---------- Personal ---------- */
async function cargarPersonal() {
  const [{ data, error }, { data: gs }] = await Promise.all([sb.rpc('panel_personal'), sb.from('entra_grupos').select('clave, nombre, tipo')]);
  if (error) throw error;
  personal = data;
  grupos = Object.fromEntries((gs || []).map(g => [g.clave, g.nombre]));
  tiposGrupo = Object.fromEntries((gs || []).map(g => [g.clave, g.tipo]));
  // Filtro por grupo: etapas, PAS, cargos y otros, cada tipo en su apartado
  const TIPOS = { etapa: 'Etapas', pas: 'PAS', cargo: 'Cargos', otro: 'Otros' };
  $('#p-grupo').innerHTML = '<option value="">Todos los grupos</option><option value="-">Sin ningún grupo</option>' +
    Object.entries(TIPOS).map(([t, nombre]) => `<optgroup label="${nombre}">${(gs || []).filter(g => g.tipo === t)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(g => `<option value="${esc(g.clave)}">${esc(g.nombre)}</option>`).join('')}</optgroup>`).join('');
  pintarPersonal();
}
function pintarPersonal() {
  const q = $('#p-buscar').value.trim().toLowerCase();
  const acceso = $('#p-acceso').value;
  const grupo = $('#p-grupo').value;
  const verInactivos = $('#p-inactivos').checked;
  const limite = acceso && acceso !== 'nunca' ? Date.now() - Number(acceso) * 864e5 : null;
  const filas = personal.filter(p =>
    (verInactivos || p.activo) &&
    (!q || (p.nombre + ' ' + p.email).toLowerCase().includes(q)) &&
    (!grupo || (grupo === '-' ? !(p.grupos || []).length : (p.grupos || []).includes(grupo))) &&
    (acceso !== 'nunca' || !p.ultimo_acceso) &&
    (!limite || !p.ultimo_acceso || new Date(p.ultimo_acceso).getTime() < limite));
  $('#p-cuenta').textContent = `${filas.length} personas`;
  $('#t-personal').innerHTML = `<thead><tr><th>Nombre</th><th>Correo</th><th>Grupos de Microsoft 365</th><th>Último acceso</th><th>En la lista desde</th></tr></thead><tbody>${
    filas.map(p => `<tr class="${p.activo ? '' : 'inactivo'}">
      <td>${esc(p.nombre)}${p.rol === 'orientacion' ? ' <span class="chip">Rol Orientación</span>' : ''}${p.activo ? '' : ' <span class="chip">Inactivo</span>'}</td>
      <td>${esc(p.email)}</td>
      <td>${gruposEnLineas(p.grupos || [])}</td>
      <td>${p.ultimo_acceso ? fecha(p.ultimo_acceso) : '<span class="nunca">Nunca</span>'}</td>
      <td>${fecha(p.alta)}</td></tr>`).join('')}</tbody>`;
}

/* ---------- Cuentas compartidas ---------- */
let cuentas = [];
async function cargarCuentas() {
  const { data, error } = await sb.from('cuentas_compartidas').select('*').order('cuenta').order('desde', { nullsFirst: false });
  if (error) throw error;
  cuentas = data;
  pintarCuentas();
}
function pintarCuentas() {
  const historial = $('#c-historial').checked;
  const filas = cuentas.filter(c => historial || !c.hasta);
  const campo = (c, k, tipo = 'text') => `<input type="${tipo}" data-id="${c.id}" data-k="${k}" value="${esc(c[k] ?? '')}">`;
  $('#t-cuentas').innerHTML = `<thead><tr><th>Cuenta</th><th>Función</th><th>Persona que la usa</th><th>Desde</th><th>Hasta</th><th>Contraseña cambiada</th><th>Notas</th><th></th></tr></thead><tbody>${
    filas.map(c => `<tr class="${c.hasta ? 'historico' : ''}">
      <td>${campo(c, 'cuenta')}</td><td>${campo(c, 'funcion')}</td><td>${campo(c, 'persona')}</td>
      <td>${campo(c, 'desde', 'date')}</td><td>${campo(c, 'hasta', 'date')}</td><td>${campo(c, 'contrasena_cambiada', 'date')}</td>
      <td>${campo(c, 'notas')}</td>
      <td style="white-space:nowrap">${c.hasta ? '' : `<button class="btn-s" data-cambio="${c.id}" type="button">Cambio de persona</button> `}<button class="btn-s peligro" data-borrar="${c.id}" type="button">Borrar</button></td></tr>`).join('')}</tbody>`;
}
async function guardarCampo(input) {
  const id = Number(input.dataset.id), k = input.dataset.k;
  let v = input.value.trim(); if (k === 'cuenta') v = v.toLowerCase();
  const { error } = await sb.from('cuentas_compartidas').update({ [k]: v || null, cambiado: new Date().toISOString() }).eq('id', id);
  if (error) return aviso($('#c-msg'), 'No se ha guardado: ' + error.message, false);
  Object.assign(cuentas.find(c => c.id === id), { [k]: v || null });
  aviso($('#c-msg'), 'Guardado');
  if (k === 'hasta') pintarCuentas();
}
async function cambioDePersona(id) {
  const c = cuentas.find(x => x.id === id);
  const persona = prompt(`¿Quién usa a partir de hoy ${c.cuenta}?`);
  if (!persona) return;
  const { error: e1 } = await sb.from('cuentas_compartidas').update({ hasta: hoy() }).eq('id', id);
  const { error: e2 } = e1 ? {} : await sb.from('cuentas_compartidas').insert({ cuenta: c.cuenta, funcion: c.funcion, persona: persona.trim(), desde: hoy(), notas: 'Cambiar la contraseña' });
  if (e1 || e2) return aviso($('#c-msg'), 'No se ha guardado: ' + (e1 || e2).message, false);
  await cargarCuentas();
  aviso($('#c-msg'), 'Cambio registrado. Recuerda cambiar la contraseña y apuntar la fecha.');
}
async function nuevaCuenta() {
  const cuenta = prompt('Correo de la cuenta compartida (por ejemplo, nombre@salesianas.org):');
  if (!cuenta) return;
  const { error } = await sb.from('cuentas_compartidas').insert({ cuenta: cuenta.trim().toLowerCase(), desde: hoy() });
  if (error) return aviso($('#c-msg'), 'No se ha guardado: ' + error.message, false);
  await cargarCuentas();
}
async function borrarCuenta(id) {
  const c = cuentas.find(x => x.id === id);
  if (!confirm(`¿Borrar la fila de ${c.cuenta}${c.persona ? ' (' + c.persona + ')' : ''}? Si la persona ha cambiado, usa mejor «Cambio de persona» para conservar el historial.`)) return;
  const { error } = await sb.from('cuentas_compartidas').delete().eq('id', id);
  if (error) return aviso($('#c-msg'), 'No se ha borrado: ' + error.message, false);
  await cargarCuentas();
}
function descargarCuentas() {
  const cab = ['Cuenta', 'Función', 'Persona', 'Desde', 'Hasta', 'Contraseña cambiada', 'Notas'];
  const filas = cuentas.map(c => [c.cuenta, c.funcion, c.persona, c.desde, c.hasta, c.contrasena_cambiada, c.notas]);
  const csv = [cab, ...filas].map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `Cuentas compartidas ${hoy()}.csv`;
  a.click();
}

/* ---------- Cursos y listas ---------- */
const ETAPAS = ['Infantil', 'Primaria', 'ESO', 'Bachillerato', 'CCFF'];
const etapaDe = n => /bach/i.test(n) ? 'Bachillerato' : /infant/i.test(n) ? 'Infantil' : /prim|epo/i.test(n) ? 'Primaria'
  : /eso/i.test(n) ? 'ESO' : /cfg|ccff|fp|ciclo|grado/i.test(n) ? 'CCFF' : '';
const L = { cursos: [], grupos: [], importadas: null };
const opcionesEtapa = sel => `<option value="">Elige etapa…</option>` + ETAPAS.map(e => `<option ${e === sel ? 'selected' : ''}>${e}</option>`).join('');
const nombreValido = n => /^[^,]+,[^,]+$/.test(n.trim());
const normalizarNombre = t => t.trim().replace(/\s+/g, ' ').replace(/\s*,\s*/, ', ');

async function cargarListas() {
  const { data, error } = await sb.rpc('panel_cursos');
  if (error) throw error;
  L.cursos = data;
  $('#t-cursos').innerHTML = `<thead><tr><th>Curso</th><th>Grupos</th><th>Alumnado</th><th>Por etapa</th><th>Estado</th><th></th></tr></thead><tbody>${
    data.map(c => `<tr><td><b>${esc(c.nombre)}</b></td><td>${c.grupos}</td><td>${c.alumnado}</td><td>${esc(c.por_etapa || '—')}</td>
      <td>${c.activo ? '<span class="tag-actual">Actual</span>' : '<span class="tag-off">Sin activar</span>'}</td>
      <td style="white-space:nowrap"><button class="btn-s" type="button" data-ver-curso="${c.id}">Ver listas</button>${c.activo ? '' : ` <button class="btn-s pri" type="button" data-activar="${c.id}">Activar</button> <button class="btn-s peligro" type="button" data-quitar-curso="${c.id}">Quitar</button>`}</td></tr>`).join('')
    || '<tr><td colspan="6">Todavía no hay cursos.</td></tr>'}</tbody>`;
  const previo = $('#l-curso').value;
  $('#l-curso').innerHTML = data.map(c => `<option value="${c.id}">${esc(c.nombre)}${c.activo ? ' (actual)' : ''}</option>`).join('');
  $('#l-curso').value = data.some(c => String(c.id) === previo) ? previo : (data.find(c => c.activo) || data[0])?.id ?? '';
  await cargarGruposCurso();
}
async function cargarGruposCurso() {
  const curso = Number($('#l-curso').value);
  Object.keys(alumnadoGuardado).forEach(k => delete alumnadoGuardado[k]);
  L.grupos = [];
  if (curso) {
    const { data, error } = await sb.rpc('panel_grupos', { p_curso: curso });
    if (error) return aviso($('#l-msg'), 'No se han podido cargar los grupos: ' + error.message, false);
    L.grupos = data;
  }
  const previo = $('#l-grupo').value;
  $('#l-grupo').innerHTML = `<option value="">${L.grupos.length ? 'Elige un grupo…' : 'Este curso no tiene grupos'}</option>` +
    ETAPAS.concat(['']).map(e => {
      const gs = L.grupos.filter(g => (g.etapa || '') === e || (e === '' && !ETAPAS.includes(g.etapa)));
      return gs.length ? `<optgroup label="${esc(e || 'Sin etapa')}">${gs.map(g => `<option value="${g.id}">${esc(g.nombre)} (${g.alumnado})</option>`).join('')}</optgroup>` : '';
    }).join('');
  $('#l-grupo').value = L.grupos.some(g => String(g.id) === previo) ? previo : '';
  await pintarGrupo();
}
async function pintarGrupo() {
  const g = L.grupos.find(x => String(x.id) === $('#l-grupo').value);
  if (!g) { $('#l-detalle').innerHTML = ''; return; }
  const { data, error } = await sb.rpc('panel_alumnado', { p_grupo: g.id });
  if (error) { $('#l-detalle').innerHTML = `<p class="err">${esc(error.message)}</p>`; return; }
  const activos = data.filter(a => a.activo).length;
  const otros = L.grupos.filter(x => x.id !== g.id);
  $('#l-detalle').innerHTML = `
    <form class="l-grupo-form" id="l-grupo-form">
      <label>Grupo <input name="nombre" value="${esc(g.nombre)}" required></label>
      <label>Etapa <select name="etapa">${opcionesEtapa(g.etapa)}</select></label>
      <button class="btn-s" type="submit">Guardar grupo</button>
      <span class="adm-nota" style="margin:0">Tutor/a: ${esc(g.tutor || '—')}${g.tutor_email ? '' : ' (sin cuenta enlazada: elígelo en «Tutorías»)'} · ${activos} alumnos/as</span>
    </form>
    <div class="adm-tabla-env"><table class="adm"><thead><tr><th>Nº</th><th>Apellidos, Nombre</th><th>Estado</th><th></th></tr></thead><tbody>${
      data.map((a, i) => `<tr class="${a.activo ? '' : 'inactivo'}"><td>${i + 1}</td><td>${esc(a.nombre)}</td><td>${a.activo ? 'Activo' : '<span class="chip">Baja</span>'}</td>
        <td style="white-space:nowrap"><button class="btn-s" type="button" data-renombrar="${a.id}">Cambiar nombre</button>
        ${otros.length ? `<select data-mover="${a.id}" aria-label="Pasar a otro grupo"><option value="">Pasar a…</option>${otros.map(o => `<option value="${o.id}">${esc(o.nombre)}</option>`).join('')}</select>` : ''}
        <button class="btn-s ${a.activo ? 'peligro' : ''}" type="button" data-baja="${a.id}" data-activo="${a.activo}">${a.activo ? 'Dar de baja' : 'Reactivar'}</button></td></tr>`).join('')
      || '<tr><td colspan="4">Sin alumnado.</td></tr>'}</tbody></table></div>
    <form class="l-grupo-form" id="l-alta" style="margin-top:12px">
      <label>Alta <input name="nombre" placeholder="Apellidos, Nombre" required></label>
      <button class="btn-s pri" type="submit">Añadir a ${esc(g.nombre)}</button>
    </form>`;
  $('#l-detalle').dataset.alumnado = JSON.stringify(data);
}
async function llamar(fn, args, ok) {
  const { error } = await sb.rpc(fn, args);
  if (error) { aviso($('#l-msg'), 'No se ha guardado: ' + error.message, false); return false; }
  if (ok) aviso($('#l-msg'), ok);
  return true;
}
async function nuevoCurso() {
  const ult = L.cursos.map(c => parseInt(c.nombre, 10)).filter(Boolean).sort().pop() || new Date().getFullYear() - 1;
  const nombre = prompt('Nombre del curso nuevo (se crea sin activar):', `${ult + 1}-${ult + 2}`);
  if (!nombre) return;
  if (await llamar('panel_crear_curso', { p_nombre: nombre.trim() }, `Curso ${nombre.trim()} creado sin activar. Ahora importa sus listas.`)) {
    await cargarListas();
    const c = L.cursos.find(x => x.nombre === nombre.trim());
    if (c) { $('#l-curso').value = c.id; await cargarGruposCurso(); }
  }
}
async function activarCurso(id) {
  const c = L.cursos.find(x => x.id === id);
  if (!confirm(`¿Activar ${c.nombre}?\n\nTodas las webs (Control de baños, Distribución del aula, Orientación…) pasarán a usar sus listas (${c.grupos} grupos, ${c.alumnado} alumnos/as). El curso actual queda guardado y se puede volver a activar.`)) return;
  if (await llamar('panel_activar_curso', { p_id: id }, `Curso actual: ${c.nombre}`)) await cargarListas();
}
async function quitarCurso(id) {
  const c = L.cursos.find(x => x.id === id);
  if (c.grupos || c.alumnado) {
    const r = prompt(`Se borrará el curso ${c.nombre} con sus ${c.grupos} grupos y ${c.alumnado} alumnos/as. No se puede deshacer.\n\nPara confirmar, escribe el nombre del curso:`);
    if (r === null) return;
    if (r.trim() !== c.nombre) { aviso($('#l-msg'), 'No se ha quitado: el nombre no coincide.', false); return; }
  } else if (!confirm(`¿Quitar el curso ${c.nombre}? Está vacío.`)) return;
  if (await llamar('panel_quitar_curso', { p_id: id }, `Curso ${c.nombre} quitado.`)) await cargarListas();
}

// Lector de PDF (solo se descarga al importar)
let pdfjsPromesa = null;
function cargarPdfJs() {
  return (pdfjsPromesa ||= new Promise((res, rej) => {
    const base = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    const sc = Object.assign(document.createElement('script'), { src: base + 'pdf.min.js' });
    sc.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js'; res(window.pdfjsLib); };
    sc.onerror = () => { pdfjsPromesa = null; rej(new Error('No se pudo cargar el lector de PDF (¿sin conexión?)')); };
    document.head.appendChild(sc);
  }));
}
// Nombres de Séneca → nombres más claros (se pueden corregir en la vista previa)
const NOMBRES_SENECA = { '1ºABachSoc': '1º Bach A', '1ºBBachCi': '1º Bach B', '2º Bach HS': '2º Bach A', '2º BACH CyT': '2º Bach B' };
const limpiarGrupo = s => NOMBRES_SENECA[s] ||
  // «1ºA INFANT» → «1º Infantil A» · «3ºB PRIM» → «3º Primaria B»
  s.replace(/^(\d)\s*º\s*([A-Z])\s*INFANT\w*$/i, (m, n, l) => `${n}º Infantil ${l.toUpperCase()}`)
   .replace(/^(\d)\s*º\s*([A-Z])\s*PRIM\w*$/i, (m, n, l) => `${n}º Primaria ${l.toUpperCase()}`)
   .replace(/º\s*/, 'º ').replace(/\bESO\s*([A-Z])$/i, 'ESO $1').replace(/\bBACH\b/i, 'Bach').replace(/\s+/g, ' ').trim();
// PDF «Lista de clase» de Séneca: una clase por página (la misma lectura que usaba Control de baños)
async function leerListasSeneca(file) {
  const lib = await cargarPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const grupos = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const tc = await (await pdf.getPage(p)).getTextContent();
    const filas = [];
    for (const it of tc.items) {
      if (!it.str.trim() || it.transform[1] || it.transform[2]) continue;   // vacío o texto girado del margen
      const y = it.transform[5];
      let f = filas.find(f => Math.abs(f.y - y) <= 2);
      if (!f) filas.push((f = { y, items: [] }));
      f.items.push({ x: it.transform[4], s: it.str });
    }
    const lineas = filas.sort((a, b) => b.y - a.y)
      .map(f => f.items.sort((a, b) => a.x - b.x).map(i => i.s).join(' ').replace(/\s+/g, ' ').trim());
    const texto = lineas.join('\n');
    const m = texto.match(/LISTA DE CLASE DE\s+(.+?)\s*(?:\(|$)/m);   // a veces sin «( Tres Años )» en la misma línea
    if (!m) continue;
    const tutor = (texto.match(/TUTOR\/A\s*:\s*(.+)/) || [])[1]?.trim() || '';
    const alumnos = [];
    let dentro = false;
    for (const l of lineas) {
      if (/N[º°o]\s*orden/i.test(l)) { dentro = true; continue; }
      if (!dentro) continue;
      if (/^\S+,\s*\d{2}\/\d{2}\/\d{4}$|^P[áa]g\./.test(l)) break;   // "Sevilla, 13/09/2026" o "Pág. 1 de 4"
      const mm = l.match(/^(\d{1,2})\s*(.+,.+)$/) || l.match(/^(.+,.+?)\s*(\d{1,2})$/);
      if (mm) alumnos.push((/^\d/.test(mm[1]) ? mm[2] : mm[1]).trim());
    }
    const original = m[1].trim(), previa = grupos.find(g => g.original === original);   // clase que sigue en otra página
    if (previa) previa.alumnos.push(...alumnos);
    else grupos.push({ original, nombre: limpiarGrupo(original), etapa: etapaDe(original), tutor, alumnos });
  }
  return grupos;
}
// Excel o CSV de Séneca (por ejemplo, el alumnado de una etapa entera): una fila por alumno/a, con una columna
// del nombre («Alumno/a», o apellidos y nombre por separado) y otra del grupo («Unidad»)
let xlsxPromesa = null;
function cargarXlsx() {
  return (xlsxPromesa ||= new Promise((res, rej) => {
    const sc = Object.assign(document.createElement('script'), { src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' });
    sc.onload = () => res(window.XLSX);
    sc.onerror = () => { xlsxPromesa = null; rej(new Error('No se pudo cargar el lector de Excel (¿sin conexión?)')); };
    document.head.appendChild(sc);
  }));
}
async function leerExcelSeneca(file) {
  const XLSX = await cargarXlsx();
  const libro = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, defval: '' }).map(f => f.map(v => String(v).trim()));
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const iCab = filas.findIndex(f => f.some(c => /^alumno|^nombre$/.test(norm(c))) && f.some(c => /unidad|grupo/.test(norm(c))));
  if (iCab < 0) throw new Error(`«${file.name}»: no encuentro las columnas del alumno/a y de la unidad (grupo).`);
  const cab = filas[iCab].map(norm), col = re => cab.findIndex(c => re.test(c));
  const cAl = col(/^alumno/), cNom = col(/^nombre$/), cAp1 = col(/primer apellido|^apellido ?1/), cAp2 = col(/segundo apellido|^apellido ?2/), cApe = col(/^apellidos$/);
  const cUni = col(/unidad/) >= 0 ? col(/unidad/) : col(/grupo/);
  const grupos = new Map();
  for (const f of filas.slice(iCab + 1)) {
    const unidad = f[cUni];
    let nombre = cAl >= 0 ? f[cAl] : `${cApe >= 0 ? f[cApe] : [f[cAp1], f[cAp2]].filter(Boolean).join(' ')}, ${f[cNom] || ''}`;
    nombre = normalizarNombre(nombre);
    if (!unidad || !nombreValido(nombre)) continue;
    const clave = limpiarGrupo(unidad).toLowerCase();   // «1ºESO A» y «1º ESO A» son el mismo grupo
    if (!grupos.has(clave)) grupos.set(clave, { original: unidad, nombre: limpiarGrupo(unidad), etapa: etapaDe(unidad), tutor: '', alumnos: [] });
    grupos.get(clave).alumnos.push(nombre);
  }
  return [...grupos.values()];
}
async function importarArchivos(files) {
  const validos = [...files].filter(f => /\.(pdf|xlsx|xls|ods|csv)$/i.test(f.name));
  if (!validos.length) return aviso($('#l-msg'), 'Elige PDF «Lista de clase» o un Excel/CSV de Séneca', false);
  $('#l-vista').innerHTML = `<p class="adm-nota">Leyendo ${validos.length} archivo(s)…</p>`;
  try {
    const leidas = [];
    for (const f of validos) leidas.push(...(await (/\.pdf$/i.test(f.name) ? leerListasSeneca(f) : leerExcelSeneca(f))));
    L.importadas = (L.importadas || []).concat(leidas);
    await prepararVistaPrevia();
  } catch (e) { $('#l-vista').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

// Cada grupo leído: si ya existe en el curso, se compara con su lista (altas, bajas y reactivaciones);
// si no, se creará nuevo. Así sirve igual al empezar el curso que para las altas y bajas de mitad de curso.
const claveNombre = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').replace(/\s*,\s*/, ',').trim();
const alumnadoGuardado = {};
async function prepararVistaPrevia() {
  for (const g of L.importadas || []) {
    const ex = L.grupos.find(x => x.nombre.toLowerCase() === g.nombre.trim().toLowerCase());
    g.existente = ex || null; g.cambios = null;
    if (!ex) continue;
    if (!alumnadoGuardado[ex.id]) {
      const { data, error } = await sb.rpc('panel_alumnado', { p_grupo: ex.id });
      if (error) throw error;
      alumnadoGuardado[ex.id] = data;
    }
    const antes = alumnadoGuardado[ex.id], ahora = new Set(g.alumnos.map(claveNombre));
    const porClave = new Map(antes.map(a => [claveNombre(a.nombre), a]));
    g.cambios = {
      altas: g.alumnos.filter(n => !porClave.has(claveNombre(n))),
      reactivar: antes.filter(a => !a.activo && ahora.has(claveNombre(a.nombre))),
      bajas: antes.filter(a => a.activo && !ahora.has(claveNombre(a.nombre))),
    };
  }
  pintarVistaPrevia();
}
function pintarVistaPrevia() {
  const imp = L.importadas || [];
  const curso = L.cursos.find(c => String(c.id) === $('#l-curso').value);
  if (!imp.length) { $('#l-vista').innerHTML = '<p class="err">No se ha encontrado ninguna lista de Séneca en esos archivos.</p>'; L.importadas = null; return; }
  const nombres = imp.map(g => g.nombre.trim().toLowerCase());
  const avisos = [];
  imp.forEach((g, i) => {
    if (!g.etapa) avisos.push(`${g.nombre}: falta la etapa`);
    if (nombres.indexOf(nombres[i]) !== i) avisos.push(`${g.nombre}: está repetido en la lista`);
    if (!g.alumnos.length) avisos.push(`${g.nombre}: no se ha leído ningún alumno/a`);
  });
  const nuevos = imp.filter(g => !g.existente), act = imp.filter(g => g.existente);
  const n = k => act.reduce((t, g) => t + g.cambios[k].length, 0);
  const que = g => !g.existente ? `<span class="chip">Grupo nuevo</span>`
    : (g.cambios.altas.length + g.cambios.bajas.length + g.cambios.reactivar.length) === 0 ? '<span class="adm-nota">Sin cambios</span>'
    : [g.cambios.altas.length && `<span class="ok">+${g.cambios.altas.length} alta(s)</span>`, g.cambios.reactivar.length && `<span class="ok">${g.cambios.reactivar.length} vuelve(n)</span>`,
       g.cambios.bajas.length && `<span class="err">−${g.cambios.bajas.length} baja(s)</span>`].filter(Boolean).join(' ') +
      `<details><summary class="adm-nota">Ver nombres</summary><div class="adm-nota">${[...g.cambios.altas.map(x => '+ ' + esc(x)), ...g.cambios.reactivar.map(a => '↺ ' + esc(a.nombre)), ...g.cambios.bajas.map(a => '− ' + esc(a.nombre))].join('<br>')}</div></details>`;
  $('#l-vista').innerHTML = `<div class="adm-caja">
    <h3 class="web-t">Vista previa → ${esc(curso?.nombre || '')}${curso?.activo ? ' (curso actual)' : ''}: ${nuevos.length} grupo(s) nuevo(s), ${act.length} para actualizar</h3>
    <div class="adm-tabla-env"><table class="adm"><thead><tr><th>En Séneca</th><th>Nombre del grupo</th><th>Etapa</th><th>Tutor/a</th><th>Alumnado</th><th>Qué se hará</th><th></th></tr></thead><tbody>${
      imp.map((g, i) => `<tr><td>${esc(g.original)}</td><td><input data-i="${i}" data-k="nombre" value="${esc(g.nombre)}"></td>
        <td>${g.existente ? esc(g.existente.etapa) : `<select data-i="${i}" data-k="etapa">${opcionesEtapa(g.etapa)}</select>`}</td><td>${esc(g.tutor || '—')}</td>
        <td>${g.alumnos.length}</td><td>${que(g)}</td>
        <td><button class="btn-s peligro" type="button" data-quitar-imp="${i}">Quitar</button></td></tr>`).join('')}</tbody></table></div>
    ${avisos.length ? `<p class="err">Revisa antes de guardar: ${avisos.map(esc).join(' · ')}</p>` : ''}
    ${n('bajas') ? `<p class="adm-nota">Las bajas no borran nada: el alumno/a deja de salir en las webs y lo que ya tenga guardado se conserva. Si Séneca no trae a alguien por error, quita ese grupo de la lista.</p>` : ''}
    <div class="adm-barra" style="margin:12px 0 0">
      <button class="btn-s pri" type="button" id="l-guardar-imp" ${avisos.length ? 'disabled' : ''}>Guardar: ${nuevos.length} grupo(s) nuevo(s) · ${n('altas') + n('reactivar')} alta(s) · ${n('bajas')} baja(s)</button>
      <button class="btn-s" type="button" id="l-cancelar-imp">Cancelar</button>
      <label class="btn-s" for="l-pdf" style="cursor:pointer">Añadir más archivos</label>
    </div></div>`;
}
async function guardarImportacion() {
  const curso = Number($('#l-curso').value), imp = L.importadas;
  const nuevos = imp.filter(g => !g.existente).map(g => ({ nombre: g.nombre.trim(), etapa: g.etapa, tutor: g.tutor, alumnos: g.alumnos }));
  $('#l-guardar-imp').disabled = true;
  if (nuevos.length && !(await llamar('panel_importar_grupos', { p_curso: curso, p_grupos: nuevos }))) { $('#l-guardar-imp').disabled = false; return; }
  let hechos = 0;
  for (const g of imp.filter(x => x.existente)) {
    for (const nombre of g.cambios.altas) if (await llamar('panel_alta_alumno', { p_grupo: g.existente.id, p_nombre: nombre })) hechos++;
    for (const a of g.cambios.reactivar) if (await llamar('panel_cambiar_alumno', { p_id: a.id, p_nombre: null, p_activo: true, p_grupo: null })) hechos++;
    for (const a of g.cambios.bajas) if (await llamar('panel_cambiar_alumno', { p_id: a.id, p_nombre: null, p_activo: false, p_grupo: null })) hechos++;
    delete alumnadoGuardado[g.existente.id];
  }
  aviso($('#l-msg'), `Guardado: ${nuevos.length} grupo(s) nuevo(s) y ${hechos} alta(s) o baja(s)`);
  L.importadas = null; $('#l-vista').innerHTML = '';
  await cargarListas();
}

/* ---------- Tutorías ---------- */
async function cargarTutorias() {
  const { data, error } = await sb.rpc('panel_tutorias');
  if (error) throw error;
  // Orden: Infantil, Primaria, ESO, Bachillerato, Ciclos Formativos; dentro de cada etapa, por curso y letra
  const etapa = g => { const t = `${g.etapa || ''} ${g.grupo}`.toLowerCase();
    return /infantil/.test(t) ? 0 : /primaria|epo/.test(t) ? 1 : /eso/.test(t) ? 2 : /bach/.test(t) ? 3 : /ccff|fp|ciclo|grado/.test(t) ? 4 : 5; };
  data.sort((a, b) => etapa(a) - etapa(b) || a.grupo.localeCompare(b.grupo, 'es', { numeric: true }));
  const opciones = personal.filter(p => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  $('#t-tutorias').innerHTML = `<thead><tr><th>Grupo</th><th>Etapa</th><th>Tutor o tutora</th></tr></thead><tbody>${
    data.map(g => `<tr><td>${esc(g.grupo)}</td><td>${esc(g.etapa || '')}</td><td><select data-grupo="${g.grupo_id}">
      <option value="">— Sin asignar —</option>
      ${g.tutor_email && !opciones.some(p => p.email === g.tutor_email) ? `<option selected value="${esc(g.tutor_email)}">${esc(g.tutor || g.tutor_email)} (no está en la lista)</option>` : ''}
      ${opciones.map(p => `<option value="${esc(p.email)}" ${p.email === g.tutor_email ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}
    </select></td></tr>`).join('')}</tbody>`;
}
async function cambiarTutor(sel) {
  const { error } = await sb.rpc('panel_cambiar_tutor', { p_grupo: Number(sel.dataset.grupo), p_email: sel.value || null });
  if (error) return aviso($('#t-msg'), 'No se ha guardado: ' + error.message, false);
  aviso($('#t-msg'), 'Tutoría actualizada en todas las webs');
}

/* ---------- Orientación (niveles, dentro de «Quién puede hacer qué») ---------- */
const QUIEN = {
  tutor: 'Tutores (fichas de su grupo)',
  equipo_docente: 'Equipo docente (fichas del alumnado al que da clase, según Horarios)',
  etapa: 'Claustro de la etapa (fichas de su etapa)',
};
async function cambiarNivel(sel, msg = $('#q-msg')) {
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb.from('orientacion_acceso')
    .update({ nivel: sel.value, cambiado: new Date().toISOString(), cambiado_por: user?.email }).eq('quien', sel.dataset.quien);
  if (error) return aviso(msg, 'No se ha guardado: ' + error.message, false);
  aviso(msg, 'Guardado: se aplica al momento');
}

/* ---------- Quién puede hacer qué ---------- */
// Cada web: lo que viene dado (todo el personal o un grupo de Microsoft 365, solo lectura) y los permisos que se
// pueden cambiar aquí (tabla «permisos», o el rol «Orientación» de la lista del personal).
const WEBS = [
  { web: 'Panel de Administración', permiso: 'administracion', accion: 'Acceso además del Equipo Directivo' },
  { web: 'Todas las webs', permiso: 'todas', accion: 'Administrar todas las webs a la vez' },
  { web: 'Horarios', permiso: 'horarios', accion: 'Administrar ausencias, avisos y horarios' },
  { web: 'Control de baños', permiso: 'banos', accion: 'Administrar alumnado y clases' },
  { web: 'Reserva de espacios', permiso: 'reservas', accion: 'Administrar espacios y reservas' },
  { web: 'Distribución del aula' },
  { web: 'PAC', permiso: 'pac', accion: 'Coordinar el documento' },
  { web: 'Calendario', permiso: 'calendario', accion: 'Administrar el calendario' },
  { web: 'Incidencias', permiso: 'incidencias', accion: 'Gestionar incidencias', roles: { admin: 'Administración', coordinador: 'Coordinación', tecnico: 'Técnico/a' } },
  { web: 'Orientación', permiso: 'orientacion_rol', accion: 'Rol «Orientación»: ver y editar todas las fichas', reglas: true },
];
const NIVELES = { editar: 'Editar', ver: 'Ver', medidas: 'Medidas', nada: 'Nada' };
let abiertas = new Set();

let modoQuien = 'web';
async function cargarQuien() {
  const [{ data: quien, error }, { data: permisos, error: e2 }, { data: reglas }, { data: tutorias }] = await Promise.all([
    sb.rpc('panel_quien_hace_que'), sb.rpc('panel_permisos'), sb.from('orientacion_acceso').select('*').order('orden'), sb.rpc('panel_tutorias')]);
  if (error || e2) throw error || e2;
  if (modoQuien === 'persona') return pintarPorPersona(permisos, reglas || [], tutorias || []);
  document.querySelectorAll('#q-lista details[open]').forEach(d => abiertas.add(d.dataset.web));
  const activos = personal.filter(p => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  $('#q-lista').innerHTML = `<p class="adm-nota">Escuelas Salesianas María Auxiliadora · Nervión — situación a ${fecha(new Date())}. Lo que viene de un grupo de Microsoft 365 se cambia en ese grupo; el resto, aquí.</p>` +
    WEBS.map(w => {
      // Filas de solo lectura: todo el personal y grupos de Microsoft 365
      const fijas = quien.filter(r => r.web === w.web && !r.quien.startsWith('Permiso') && !r.quien.startsWith('Rol') && !(w.reglas));
      const lista = permisos.filter(p => p.web === w.permiso);
      const roles = w.roles || null;
      const filaPersona = p => `<li class="q-p">${esc(p.nombre)}
        ${roles ? `<select data-rol data-web="${w.permiso}" data-email="${esc(p.email)}">${Object.entries(roles).map(([k, v]) => `<option value="${k}" ${k === p.rol ? 'selected' : ''}>${v}</option>`).join('')}</select>` : ''}
        <button class="btn-s peligro" type="button" data-quitar data-web="${w.permiso}" data-email="${esc(p.email)}" title="Quitar">Quitar</button></li>`;
      const anadir = w.permiso ? `<div class="q-add no-imprimir">
        <select data-nuevo="${w.permiso}"><option value="">Añadir persona…</option>${activos.filter(p => !lista.some(l => l.email === p.email))
          .map(p => `<option value="${esc(p.email)}">${esc(p.nombre)}</option>`).join('')}</select>
        ${roles ? `<select data-nuevo-rol="${w.permiso}">${Object.entries(roles).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>` : ''}
        <button class="btn-s pri" type="button" data-anadir="${w.permiso}">Añadir</button></div>` : '';
      const reglasOrient = w.reglas ? (reglas || []).map(r => {
        const etiqueta = QUIEN[r.quien] || `${grupos[r.quien] || r.quien} (todas las fichas)`;
        const fila = quien.find(q => q.web === 'Orientación' && q.quien === (QUIEN[r.quien] ? null : (grupos[r.quien] || r.quien)));
        return `<tr><td>${esc(etiqueta)}</td><td><select data-quien="${esc(r.quien)}">${Object.entries(NIVELES).map(([k, v]) =>
          `<option value="${k}" ${k === r.nivel ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
          <td>${esc(fila?.personas || (r.quien === 'tutor' ? 'Los tutores de cada grupo (ver «Tutorías»)' : r.quien === 'equipo_docente' ? 'Profesorado enlazado con Horarios' : r.quien === 'etapa' ? 'Según el grupo de etapa de cada docente' : '—'))}</td></tr>`;
      }).join('') : '';
      const n = lista.length + fijas.length;
      return `<details class="q-web" data-web="${esc(w.web)}" ${abiertas.has(w.web) ? 'open' : ''}>
        <summary><b>${esc(w.web)}</b> <span class="adm-nota" style="margin:0">${w.permiso ? `${lista.length} con permiso` : ''}</span></summary>
        <div class="adm-tabla-env"><table class="adm"><thead><tr><th>Qué</th><th>Quién</th><th>Personas</th></tr></thead><tbody>
          ${fijas.map(r => `<tr><td>${esc(r.accion)}</td><td>${esc(r.quien)}</td><td>${esc(r.personas || '—')}</td></tr>`).join('')}
          ${reglasOrient}
          ${w.permiso ? `<tr><td>${esc(w.accion)}</td><td>Asignado en este panel</td><td><ul class="q-lista">${lista.map(filaPersona).join('') || '<li class="adm-nota">Nadie</li>'}</ul>${anadir}</td></tr>` : ''}
        </tbody></table></div></details>`;
    }).join('') + '<p id="q-msg"></p>';
}
// Vista por persona: una fila por persona y una columna por web. En cada casilla, en gris, lo que le viene de sus
// grupos de Microsoft 365 o de su tutoría (se cambia allí) y debajo el desplegable del permiso de este panel.
const COLUMNAS = [
  { permiso: 'administracion', titulo: 'Panel', si: 'Entra' },
  { permiso: 'horarios', titulo: 'Horarios', si: 'Administra' },
  { permiso: 'banos', titulo: 'Control de baños', si: 'Administra' },
  { permiso: 'calendario', titulo: 'Calendario', si: 'Administra' },
  { permiso: 'reservas', titulo: 'Reservas', si: 'Administra' },
  { permiso: 'pac', titulo: 'PAC', si: 'Coordina' },
  { permiso: 'incidencias', titulo: 'Incidencias', roles: WEBS.find(w => w.permiso === 'incidencias').roles },
  { permiso: 'orientacion_rol', titulo: 'Orientación', si: 'Edita todo (rol)' },
  { permiso: 'todas', titulo: 'Todas las webs', si: 'Administra' },
];
let filtroQuien = { q: '', grupo: '', solo: false };

function pintarPorPersona(permisos, reglas, tutorias) {
  const nivelDe = q => reglas.find(r => r.quien === q)?.nivel || 'nada';
  const NUM = { editar: 3, ver: 2, medidas: 1, nada: 0 };
  const VERBO = { 3: 'Edita', 2: 'Ve', 1: 'Ve medidas de' };
  const ETAPAS = { infantil: 'Infantil', primaria: 'Primaria', eso: 'ESO', bachillerato: 'Bachillerato', fp: 'CCFF' };
  const dadas = p => {  // lo que viene de sus grupos o de su tutoría, por columna (solo lectura)
    const g = p.grupos || [], c = {};
    const esoBach = g.some(x => ['eso', 'bachillerato'].includes(x));
    if (g.includes('equipo_directivo')) c.administracion = ['Entra (Equipo Directivo)'];
    if (esoBach) { c.horarios = ['Ve']; c.banos = ['Registra salidas']; }
    if (g.includes('comision_pedagogica')) c.calendario = ['Administra (Comisión Pedagógica)'];
    const o = [], global = Math.max(0, ...g.map(k => NUM[nivelDe(k)] ?? 0));
    if (global) o.push(`${VERBO[global]} todas las fichas`);
    const etapa = NUM[nivelDe('etapa')];
    if (etapa > global) g.filter(k => ETAPAS[k]).forEach(k => o.push(`${VERBO[etapa]} ${ETAPAS[k]}`));
    const tutor = NUM[nivelDe('tutor')];
    if (tutor > global) tutorias.filter(t => t.tutor_email === p.email).forEach(t => o.push(`${VERBO[tutor]} ${t.grupo} (tutoría)`));
    if (o.length) c.orientacion_rol = o;
    return c;
  };
  const q = filtroQuien.q.toLowerCase();
  const filas = personal.filter(p => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(p => ({
    p, propios: Object.fromEntries(permisos.filter(x => x.email === p.email).map(x => [x.web, x.rol || 'admin'])), dadas: dadas(p),
  })).filter(({ p, propios }) =>
    (!q || (p.nombre + ' ' + p.email).toLowerCase().includes(q)) &&
    (!filtroQuien.grupo || (p.grupos || []).includes(filtroQuien.grupo)) &&
    (!filtroQuien.solo || Object.keys(propios).length));
  const casilla = (col, p, propios, dadas) => {
    const actual = propios[col.permiso];
    const opciones = col.roles ? Object.entries(col.roles) : [['admin', col.si]];
    return `<td class="${actual ? 'q-on' : ''}">${(dadas[col.permiso] || []).map(t => `<div class="q-dada">${esc(t)}</div>`).join('')}
      <select data-celda data-web="${col.permiso}" data-email="${esc(p.email)}" title="Permiso de este panel">
        <option value="">—</option>${opciones.map(([k, v]) => `<option value="${k}" ${actual && (col.roles ? k === actual : true) ? 'selected' : ''}>${esc(v)}</option>`).join('')}
      </select></td>`;
  };

  $('#q-lista').innerHTML = `<p class="adm-nota">Escuelas Salesianas María Auxiliadora · Nervión — situación a ${fecha(new Date())}.
      En <span class="q-dada" style="display:inline">gris</span>, lo que le viene de su grupo de Microsoft 365 o de su tutoría (se cambia allí).
      El desplegable es el permiso de este panel: elige «—» para quitarlo. Las casillas con permiso salen en azul.
      Todo el personal puede, además, reservar espacios y usar Distribución del aula.</p>
    <div class="adm-barra no-imprimir">
      <input type="search" id="qp-buscar" placeholder="Buscar persona…" value="${esc(filtroQuien.q)}">
      <select id="qp-grupo">${$('#p-grupo')?.innerHTML || ''}</select>
      <label><input type="checkbox" id="qp-solo" ${filtroQuien.solo ? 'checked' : ''}> Solo con permisos del panel</label>
      <span class="adm-nota" style="margin:0">${filas.length} personas</span>
    </div>
    <div class="adm-tabla-env q-matriz"><table class="adm"><thead><tr><th>Persona</th>${COLUMNAS.map(c => `<th>${esc(c.titulo)}</th>`).join('')}</tr></thead><tbody>${
      filas.map(({ p, propios, dadas }) => `<tr><th scope="row">${esc(p.nombre)}</th>${COLUMNAS.map(c => casilla(c, p, propios, dadas)).join('')}</tr>`).join('')
    }</tbody></table></div><p id="q-msg"></p>`;
  $('#qp-grupo').value = filtroQuien.grupo;
  const refiltrar = () => { filtroQuien = { q: $('#qp-buscar').value, grupo: $('#qp-grupo').value, solo: $('#qp-solo').checked }; pintarPorPersona(permisos, reglas, tutorias); $('#qp-buscar').focus(); $('#qp-buscar').setSelectionRange(99, 99); };
  $('#qp-buscar').oninput = refiltrar; $('#qp-grupo').onchange = refiltrar; $('#qp-solo').onchange = refiltrar;
}
async function cambiarCelda(sel) {
  const { web, email } = sel.dataset;
  const nombre = personal.find(x => x.email === email)?.nombre || email;
  if (!sel.value && !confirm(`¿Quitar a ${nombre} este permiso?`)) return cargarQuien();
  const { error } = sel.value
    ? await sb.rpc('panel_poner_permiso', { p_web: web, p_email: email, p_rol: sel.value })
    : await sb.rpc('panel_quitar_permiso', { p_web: web, p_email: email });
  await cargarQuien();
  aviso($('#q-msg'), error ? 'No se ha guardado: ' + error.message : 'Guardado', !error);
}

async function anadirPermiso(web) {
  const email = $(`[data-nuevo="${web}"]`).value;
  if (!email) return;
  const rol = $(`[data-nuevo-rol="${web}"]`)?.value || 'admin';
  const { error } = await sb.rpc('panel_poner_permiso', { p_web: web, p_email: email, p_rol: rol });
  if (error) return aviso($('#q-msg'), 'No se ha guardado: ' + error.message, false);
  await cargarQuien(); aviso($('#q-msg'), 'Permiso añadido');
}
async function quitarPermiso(web, email) {
  const p = personal.find(x => x.email === email);
  if (!confirm(`¿Quitar a ${p?.nombre || email} este permiso?`)) return;
  const { error } = await sb.rpc('panel_quitar_permiso', { p_web: web, p_email: email });
  if (error) return aviso($('#q-msg'), 'No se ha quitado: ' + error.message, false);
  await cargarQuien(); aviso($('#q-msg'), 'Permiso quitado');
}
async function cambiarRol(sel) {
  const { error } = await sb.rpc('panel_poner_permiso', { p_web: sel.dataset.web, p_email: sel.dataset.email, p_rol: sel.value });
  if (error) return aviso($('#q-msg'), 'No se ha guardado: ' + error.message, false);
  aviso($('#q-msg'), 'Rol cambiado');
}

/* ---------- Pestañas y arranque ---------- */
const CARGAS = { personal: cargarPersonal, cuentas: cargarCuentas, listas: cargarListas, tutorias: cargarTutorias, orientacion: cargarQuien, quien: cargarQuien };
const PESTANA = { cuentas: 'personal', orientacion: 'quien' };   // apartados que van dentro de otra pestaña
async function mostrar(p) {
  if (p === 'orientacion') p = 'quien';   // los niveles de Orientación están en «Quién puede hacer qué»
  document.querySelectorAll('.adm-pest [data-p]').forEach(b => b.setAttribute('aria-selected', b.dataset.p === (PESTANA[p] || p)));
  document.querySelectorAll('.adm-sub [data-p]').forEach(b => b.classList.toggle('pri', b.dataset.p === p));
  document.querySelectorAll('[data-panel]').forEach(d => { d.hidden = d.dataset.panel !== p; d.classList.toggle('imprimir', d.dataset.panel === p); });
  history.replaceState(null, '', '#' + p);
  try { await CARGAS[p](); } catch (e) { $(`[data-panel="${p}"]`).insertAdjacentHTML('afterbegin', `<p class="err">No se han podido cargar los datos: ${esc(e.message)}</p>`); }
}

(async function () {
  const { data: { session } } = await sb.auth.getSession();
  const login = msg => { $('#login').hidden = false; if (msg) { $('#entrar').hidden = true; $('#login-msg').innerHTML = msg; } };
  if (!session) {
    login();
    $('#entrar').onclick = async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider: 'azure', options: { scopes: 'email openid profile', redirectTo: location.origin + location.pathname } });
      if (error) $('#login-msg').textContent = error.message;
    };
    return;
  }
  $('#usuario').textContent = session.user.user_metadata?.full_name || session.user.email;
  $('#sesion').hidden = false;
  $('#salir').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  const { data: puede } = await sb.rpc('es_admin_panel');
  if (!puede) {
    login(`La cuenta <b>${esc(session.user.email)}</b> no tiene acceso al panel. Es solo para el Equipo Directivo.`);
    return;
  }
  $('#app').hidden = false;
  await cargarPersonal().catch(e => $('#t-personal').outerHTML = `<p class="err">${esc(e.message)}</p>`);

  document.querySelectorAll('.adm-pest [data-p], .adm-sub [data-p]').forEach(b => b.onclick = () => mostrar(b.dataset.p));
  ['#p-buscar', '#p-grupo', '#p-acceso', '#p-inactivos'].forEach(s => $(s).addEventListener('input', pintarPersonal));
  $('#c-historial').onchange = pintarCuentas;
  $('#c-nueva').onclick = nuevaCuenta;
  $('#c-csv').onclick = descargarCuentas;
  $('#t-cuentas').addEventListener('change', e => e.target.matches('input[data-id]') && guardarCampo(e.target));
  $('#t-cuentas').addEventListener('click', e => {
    if (e.target.dataset.cambio) cambioDePersona(Number(e.target.dataset.cambio));
    if (e.target.dataset.borrar) borrarCuenta(Number(e.target.dataset.borrar));
  });
  $('#l-nuevo').onclick = nuevoCurso;
  $('#l-curso').onchange = () => { L.importadas = null; $('#l-vista').innerHTML = ''; cargarGruposCurso(); };
  $('#l-grupo').onchange = pintarGrupo;
  $('#l-pdf').onchange = e => { importarArchivos(e.target.files); e.target.value = ''; };
  $('#t-cursos').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.activar) activarCurso(Number(b.dataset.activar));
    if (b.dataset.quitarCurso) quitarCurso(Number(b.dataset.quitarCurso));
    if (b.dataset.verCurso) { $('#l-curso').value = b.dataset.verCurso; L.importadas = null; $('#l-vista').innerHTML = ''; await cargarGruposCurso(); $('#l-curso').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  $('#l-vista').addEventListener('input', e => {
    const i = e.target.dataset.i; if (i == null) return;
    L.importadas[Number(i)][e.target.dataset.k] = e.target.value;
    if (e.target.tagName === 'SELECT') pintarVistaPrevia();
  });
  $('#l-vista').addEventListener('change', e => e.target.dataset.k === 'nombre' && prepararVistaPrevia().catch(err => aviso($('#l-msg'), err.message, false)));
  $('#l-vista').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.quitarImp) { L.importadas.splice(Number(b.dataset.quitarImp), 1); L.importadas.length ? pintarVistaPrevia() : ($('#l-vista').innerHTML = '', L.importadas = null); }
    if (b.id === 'l-cancelar-imp') { L.importadas = null; $('#l-vista').innerHTML = ''; }
    if (b.id === 'l-guardar-imp') guardarImportacion();
  });
  $('#l-detalle').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, g = Number($('#l-grupo').value);
    if (f.id === 'l-grupo-form') {
      if (await llamar('panel_cambiar_grupo', { p_id: g, p_nombre: f.nombre.value, p_etapa: f.etapa.value }, 'Grupo guardado')) await cargarListas();
    }
    if (f.id === 'l-alta') {
      const nombre = normalizarNombre(f.nombre.value);
      if (!nombreValido(nombre)) return aviso($('#l-msg'), 'Escríbelo así: Apellidos, Nombre', false);
      if (await llamar('panel_alta_alumno', { p_grupo: g, p_nombre: nombre }, `${nombre}: alta hecha`)) await cargarGruposCurso();
    }
  });
  $('#l-detalle').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const al = JSON.parse($('#l-detalle').dataset.alumnado || '[]');
    if (b.dataset.renombrar) {
      const a = al.find(x => x.id === Number(b.dataset.renombrar));
      const nuevo = prompt('Apellidos, Nombre:', a.nombre);
      if (!nuevo || normalizarNombre(nuevo) === a.nombre) return;
      if (!nombreValido(nuevo)) return aviso($('#l-msg'), 'Escríbelo así: Apellidos, Nombre', false);
      if (await llamar('panel_cambiar_alumno', { p_id: a.id, p_nombre: normalizarNombre(nuevo), p_activo: null, p_grupo: null }, 'Nombre cambiado')) await pintarGrupo();
    }
    if (b.dataset.baja) {
      const a = al.find(x => x.id === Number(b.dataset.baja)), activo = b.dataset.activo !== 'true';
      if (!activo && !confirm(`¿Dar de baja a ${a.nombre}?\n\nDejará de salir en las webs. Lo que ya tenga guardado (salidas, distribuciones…) se conserva.`)) return;
      if (await llamar('panel_cambiar_alumno', { p_id: a.id, p_nombre: null, p_activo: activo, p_grupo: null }, activo ? 'Reactivado/a' : 'Baja hecha')) await cargarGruposCurso();
    }
  });
  $('#l-detalle').addEventListener('change', async e => {
    const s = e.target; if (!s.dataset.mover || !s.value) return;
    const al = JSON.parse($('#l-detalle').dataset.alumnado || '[]'), a = al.find(x => x.id === Number(s.dataset.mover));
    const destino = L.grupos.find(g => String(g.id) === s.value);
    if (!confirm(`¿Pasar a ${a.nombre} a ${destino.nombre}?`)) { s.value = ''; return; }
    if (await llamar('panel_cambiar_alumno', { p_id: a.id, p_nombre: null, p_activo: null, p_grupo: destino.id }, `Ahora está en ${destino.nombre}`)) await cargarGruposCurso();
  });
  $('#t-tutorias').addEventListener('change', e => e.target.matches('select[data-grupo]') && cambiarTutor(e.target));
  $('#q-imprimir').onclick = () => window.print();
  document.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => {
    modoQuien = b.dataset.modo;
    document.querySelectorAll('[data-modo]').forEach(x => x.classList.toggle('pri', x === b));
    cargarQuien();
  });
  window.addEventListener('beforeprint', () => document.querySelectorAll('#q-lista details').forEach(d => d.open = true));
  $('#q-lista').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.anadir) anadirPermiso(b.dataset.anadir);
    if ('quitar' in b.dataset) quitarPermiso(b.dataset.web, b.dataset.email);
  });
  $('#q-lista').addEventListener('change', e => {
    if (e.target.matches('select[data-rol]')) cambiarRol(e.target);
    if (e.target.matches('select[data-celda]')) cambiarCelda(e.target);
    if (e.target.matches('select[data-quien]')) cambiarNivel(e.target, $('#q-msg'));
  });

  const inicial = location.hash.slice(1);
  if (CARGAS[inicial] && inicial !== 'personal') mostrar(inicial);
})();
