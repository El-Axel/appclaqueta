/* ===== Claqueta · ventana Trabajo (detalle de un trabajo agendado) =====  trabajo.html?id=ID */
const V = $('#vista'), id = new URLSearchParams(location.search).get('id');
const rel = f => { const n = Math.round((new Date(f + 'T00:00') - new Date(hoy() + 'T00:00')) / 864e5); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n > 1 ? `En ${n} días` : 'Ya pasó'; };

function trabajo() {
  const t = S.trabajos.find(x => x.id === id); if (!t) return V.innerHTML = noEncontrado('agenda.html');
  const c = S.cots.find(x => x.id === t.cotId) || {}, cl = cli(c.clienteId), k = t.clima;
  const ruta = t.lat != null ? `${t.lat},${t.lng}` : t.dir;
  const notas = (t.notas || '').split('\n').filter(Boolean);
  V.innerHTML = `<div class="flex items-center justify-between gap-3 mt-6 mb-6 entra" style="--i:1"><div class="flex items-center gap-3">${volver('agenda.html', 'la agenda')}<p class="muted text-sm">Trabajo agendado</p></div><span class="chip chip-enviada">${rel(t.fecha)}</span></div>
    <div class="entra" style="--i:2"><h1 class="text-3xl font-extrabold leading-tight tracking-tight break-words">${esc(c.titulo)}</h1>
      <a href="clientes.html?id=${c.clienteId}" class="text-menta font-bold">${esc(cl.nombre)}</a>
      <p class="mt-2"><span class="cap block">${fdl(t.fecha)}</span><span class="muted num">${hora(t.ini)} – ${hora(t.fin)}</span></p></div>

    <section class="cristal bloque mt-5 entra" style="--i:3" aria-labelledby="t-u"><h2 id="t-u" class="font-extrabold">Ubicación</h2>
      <p class="mt-1 ${t.dir ? '' : 'muted'}">${esc(t.dir) || 'Sin dirección. Edita el trabajo para agregarla.'}</p>
      <div id="mapa"></div>
      ${ruta ? `<div class="grid grid-cols-2 gap-3 mt-4"><a class="btn btn-p" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ruta)}">Cómo llegar</a><button class="btn btn-s" id="copiar">Copiar dirección</button></div>` : ''}</section>

    <section class="cristal bloque mt-3 entra" style="--i:4" aria-labelledby="t-c"><h2 id="t-c" class="font-extrabold">Pronóstico del día</h2>
      <div id="clima" class="mt-1">${k ? `<p class="font-bold">${esc(k.condicion)}</p><p class="num">Mín. ${k.min}° · Máx. ${k.max}° · Lluvia ${k.lluvia}%</p><p class="text-xs muted mt-1">Actualizado ${new Date(k.consultadoEn).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>` : '<p class="muted">Sin pronóstico por ahora.</p>'}</div></section>

    <section class="cristal bloque mt-3 entra" style="--i:5" aria-labelledby="t-n"><h2 id="t-n" class="font-extrabold">Notas y recordatorios</h2>
      ${notas.length ? `<ul class="grid gap-1.5 mt-2">${notas.map(l => `<li class="flex gap-2"><span class="text-menta" aria-hidden="true">•</span><span>${esc(l)}</span></li>`).join('')}</ul>` : '<p class="muted mt-1">Sin notas. Edita el trabajo para agregar lo que debes llevar.</p>'}</section>

    <section class="cristal bloque mt-3 entra" style="--i:6" aria-labelledby="t-g"><h2 id="t-g" class="font-extrabold">Google Calendar</h2>
      <p id="gcal" class="text-sm muted mt-1">${t.eventoId ? 'Este trabajo ya está en tu Google Calendar.' : googleListo() ? 'Este trabajo aún no está en tu Google Calendar.' : 'Este trabajo aún no está en tu Google Calendar. Conecta tu cuenta en Ajustes.'}</p>
      ${googleListo() || t.eventoId ? `<div class="grid grid-cols-2 gap-3 mt-4">${t.eventoLink ? `<a class="btn btn-s" target="_blank" rel="noopener" href="${esc(t.eventoLink)}">Abrir en Calendar</a>` : ''}<button class="btn ${t.eventoId ? 'btn-s' : 'btn-p col-span-2'}" id="evento" ${googleListo() ? '' : 'disabled'}>${t.eventoId ? 'Actualizar evento' : 'Crear evento en Calendar'}</button></div>` : ''}</section>

    <div class="grid gap-3 mt-5 entra" style="--i:7"><a class="btn btn-s" href="cotizar.html?id=${t.cotId}">Ver cotización</a>
      <div class="grid grid-cols-2 gap-3"><button class="btn btn-s" id="editar">Editar trabajo</button><button class="btn btn-x" id="quitar">Quitar de la agenda</button></div></div>`;

  $('#copiar')?.addEventListener('click', () => navigator.clipboard?.writeText(t.dir || ruta).then(() => aviso('Dirección copiada'), () => aviso('No se pudo copiar.')));
  $('#evento')?.addEventListener('click', async () => {
    aviso('Guardando en Calendar…');
    try { await Goog.guardarEvento(t); aviso('Evento guardado en tu Google Calendar'); trabajo(); } catch (e) { aviso(Goog.mensaje(e)); }
  });
  $('#editar').onclick = () => agendar(t.cotId, trabajo);
  $('#quitar').onclick = async () => {
    if (!await confirmar({ titulo: '¿Quitar de la agenda?', texto: 'La cotización seguirá aceptada y podrás agendarla de nuevo.' + (t.eventoId ? (googleListo() ? ' También se borrará el evento de tu Google Calendar.' : ' El evento seguirá en tu Calendar porque tu cuenta no está conectada.') : ''), boton: 'Quitar', peligro: true })) return;
    if (t.eventoId && googleListo()) try { await Goog.borrarEvento(t); } catch { aviso('El evento no se pudo borrar de Calendar; bórralo a mano.'); }
    S.trabajos = S.trabajos.filter(x => x.id !== t.id); save(); location.href = 'agenda.html';
  };
}
trabajo();
