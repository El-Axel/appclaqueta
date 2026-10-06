/* ===== Claqueta · hoja «Agendar trabajo» (la usan Agenda y Trabajo) =====
   agendar(cotId, despues) abre la hoja para crear o editar el trabajo de una cotización aceptada.
   «despues» se ejecuta al guardar. Aquí se conectarán después Maps, clima y Calendar. */
const SUGERENCIAS = ['Baterías extra', 'Tarjetas de memoria', 'Impermeable', 'Trípode', 'Permiso de acceso'];
function agendar(cotId, despues) {
  const cot = S.cots.find(c => c.id === cotId); if (!cot) return;
  const t = S.trabajos.find(x => x.cotId === cotId);
  let avisado = false;
  const on = googleListo();
  const cal = `<label class="flex items-start gap-3 mb-3 text-sm"><input type="checkbox" name="cal" class="mt-0.5 w-5 h-5 shrink-0" style="accent-color:#5BE08A" ${on ? 'checked' : 'disabled'}><span>${t?.eventoId ? 'Actualizar el evento en Google Calendar' : 'Crear evento en Google Calendar'}${on ? '' : '<span class="block muted text-xs">Conecta tu cuenta de Google en Ajustes para activarlo.</span>'}</span></label>`;
  const p = abrirHoja(t ? 'Editar trabajo' : 'Agendar trabajo',
    `<p class="text-sm muted mb-4">#${cot.n} · ${esc(cot.titulo)} · ${esc(cli(cot.clienteId).nombre)}</p>` +
    campo('Fecha', 'fecha', 'date', t?.fecha, t ? '' : `min="${hoy()}"`) +
    `<div class="grid grid-cols-2 gap-3">${campo('Hora de inicio', 'ini', 'time', t?.ini || '08:00')}${campo('Hora de fin', 'fin', 'time', t?.fin || '14:00')}</div>` +
    campo('Dirección del trabajo', 'dir', 'text', t?.dir, 'placeholder="Calle, carrera o lugar" autocomplete="off" maxlength="120"') +
    `<div class="mb-3"><label class="lbl" for="c-notas">Notas (qué llevar)</label><textarea class="inp" id="c-notas" name="notas" rows="3" maxlength="400">${esc(t?.notas || '')}</textarea>
       <div class="flex flex-wrap gap-2 mt-2">${SUGERENCIAS.map(s => `<button type="button" class="f" data-s="${s}">+ ${s}</button>`).join('')}</div></div>` + cal,
    t ? 'Guardar cambios' : 'Guardar trabajo', (d, f) => {
      const m = {};
      if (!d.fecha) m.fecha = 'Este campo es obligatorio.';
      else if (d.fecha < hoy() && !(t && t.fecha === d.fecha)) m.fecha = 'Elige una fecha de hoy en adelante.';
      if (!d.ini) m.ini = 'Este campo es obligatorio.';
      if (!d.fin) m.fin = 'Este campo es obligatorio.';
      else if (d.ini && d.fin <= d.ini) m.fin = 'La hora de fin debe ser posterior a la de inicio.';
      if (Object.keys(m).length) return errores(f, m);
      // Cruce de fechas: otro trabajo el mismo día en un horario que se traslapa
      const choque = S.trabajos.find(x => x.cotId !== cotId && x.fecha === d.fecha && x.ini < d.fin && d.ini < x.fin);
      if (choque && !avisado) {
        avisado = true; const o = S.cots.find(c => c.id === choque.cotId);
        return errores(f, { ini: `Ya tienes «${o?.titulo}» ese día de ${hora(choque.ini)} a ${hora(choque.fin)} Si quieres agendar de todos modos, toca Guardar de nuevo.` });
      }
      const datos = { fecha: d.fecha, ini: d.ini, fin: d.fin, dir: d.dir.trim(), notas: d.notas.trim() };
      let nuevo = t;
      if (t) {   // si cambia el lugar o la fecha, lo calculado con Maps y clima ya no sirve
        if (t.dir !== datos.dir) { delete t.lat; delete t.lng; delete t.placeId; }
        if (t.dir !== datos.dir || t.fecha !== datos.fecha) delete t.clima;
        Object.assign(t, datos);
      } else { nuevo = { id: uid(), cotId, ...datos }; S.trabajos.push(nuevo); }
      save(); aviso(t ? 'Trabajo actualizado' : 'Trabajo agendado'); despues?.(nuevo);
      if (d.cal) sincronizar(nuevo, despues);
    });
  // Las sugerencias suman una línea a las notas
  document.querySelector('.hoja').onclick = e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const ta = document.querySelector('.hoja [name="notas"]'); ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + b.dataset.s;
  };
  return p;
}

/* Crea o actualiza el evento de Calendar sin bloquear la pantalla */
async function sincronizar(t, despues) {
  try { await Goog.guardarEvento(t); aviso('Evento guardado en tu Google Calendar'); despues?.(t); }
  catch (e) { aviso('Trabajo guardado. ' + Goog.mensaje(e)); }
}
