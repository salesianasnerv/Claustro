// Panel de Administración del portal: personal, cuentas compartidas, tutorías, reglas de Orientación y
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

/* ---------- Personal ---------- */
async function cargarPersonal() {
  const [{ data, error }, { data: gs }] = await Promise.all([sb.rpc('panel_personal'), sb.from('entra_grupos').select('clave, nombre, tipo')]);
  if (error) throw error;
  personal = data;
  grupos = Object.fromEntries((gs || []).map(g => [g.clave, g.nombre]));
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
      <td>${(p.grupos || []).map(k => `<span class="chip">${esc(grupos[k] || k)}</span>`).join('') || '<span class="adm-nota">Ninguno</span>'}</td>
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

/* ---------- Orientación ---------- */
const QUIEN = {
  tutor: 'Tutores (fichas de su grupo)',
  equipo_docente: 'Equipo docente (fichas del alumnado al que da clase, según Horarios)',
  etapa: 'Claustro de la etapa (fichas de su etapa)',
};
async function cargarOrientacion() {
  const [{ data, error }, { data: quien }] = await Promise.all([
    sb.from('orientacion_acceso').select('*').order('orden'),
    sb.rpc('panel_quien_hace_que'),
  ]);
  if (error) throw error;
  const personasDe = q => (quien || []).find(r => r.web === 'Orientación' && r.quien === (QUIEN[q] ? null : (grupos[q] || q)))?.personas;
  $('#t-orientacion').innerHTML = `<thead><tr><th>Quién</th><th>Nivel</th><th>Personas ahora</th></tr></thead><tbody>${
    data.map(r => `<tr><td>${esc(QUIEN[r.quien] || (grupos[r.quien] || r.quien) + ' (todas las fichas)')}</td>
      <td><select data-quien="${esc(r.quien)}">${['editar', 'ver', 'medidas', 'nada'].map(n =>
        `<option value="${n}" ${n === r.nivel ? 'selected' : ''}>${{ editar: 'Editar', ver: 'Ver', medidas: 'Medidas', nada: 'Nada' }[n]}</option>`).join('')}</select></td>
      <td>${esc(personasDe(r.quien) || (r.quien === 'tutor' ? 'Los tutores de cada grupo (ver «Tutorías»)' : r.quien === 'equipo_docente' ? 'Profesorado enlazado con Horarios' : r.quien === 'etapa' ? 'Según el grupo de etapa de cada docente' : '—'))}</td></tr>`).join('')}
    <tr><td>Rol «Orientación» en la lista del personal</td><td>Editar</td><td>${esc((quien || []).find(r => r.quien.startsWith('Rol'))?.personas || '—')}</td></tr></tbody>`;
}
async function cambiarNivel(sel, msg = $('#o-msg')) {
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

async function cargarQuien() {
  const [{ data: quien, error }, { data: permisos, error: e2 }, { data: reglas }] = await Promise.all([
    sb.rpc('panel_quien_hace_que'), sb.rpc('panel_permisos'), sb.from('orientacion_acceso').select('*').order('orden')]);
  if (error || e2) throw error || e2;
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
const CARGAS = { personal: cargarPersonal, cuentas: cargarCuentas, tutorias: cargarTutorias, orientacion: cargarOrientacion, quien: cargarQuien };
async function mostrar(p) {
  document.querySelectorAll('.adm-pest [data-p]').forEach(b => b.setAttribute('aria-selected', b.dataset.p === p));
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

  document.querySelectorAll('.adm-pest [data-p]').forEach(b => b.onclick = () => mostrar(b.dataset.p));
  ['#p-buscar', '#p-grupo', '#p-acceso', '#p-inactivos'].forEach(s => $(s).addEventListener('input', pintarPersonal));
  $('#c-historial').onchange = pintarCuentas;
  $('#c-nueva').onclick = nuevaCuenta;
  $('#c-csv').onclick = descargarCuentas;
  $('#t-cuentas').addEventListener('change', e => e.target.matches('input[data-id]') && guardarCampo(e.target));
  $('#t-cuentas').addEventListener('click', e => {
    if (e.target.dataset.cambio) cambioDePersona(Number(e.target.dataset.cambio));
    if (e.target.dataset.borrar) borrarCuenta(Number(e.target.dataset.borrar));
  });
  $('#t-tutorias').addEventListener('change', e => e.target.matches('select[data-grupo]') && cambiarTutor(e.target));
  $('#t-orientacion').addEventListener('change', e => e.target.matches('select[data-quien]') && cambiarNivel(e.target));
  $('#q-imprimir').onclick = () => window.print();
  window.addEventListener('beforeprint', () => document.querySelectorAll('#q-lista details').forEach(d => d.open = true));
  $('#q-lista').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.anadir) anadirPermiso(b.dataset.anadir);
    if ('quitar' in b.dataset) quitarPermiso(b.dataset.web, b.dataset.email);
  });
  $('#q-lista').addEventListener('change', e => {
    if (e.target.matches('select[data-rol]')) cambiarRol(e.target);
    if (e.target.matches('select[data-quien]')) cambiarNivel(e.target, $('#q-msg'));
  });

  const inicial = location.hash.slice(1);
  if (CARGAS[inicial] && inicial !== 'personal') mostrar(inicial);
})();
