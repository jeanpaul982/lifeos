// ==========================================
// LIFEOS - STUDY MODULE (COURSES, TOPICS & SESSIONS)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';

export async function renderStudy(container) {
  const user = getCurrentUser();
  let courses = [];
  let topics = [];
  let sessions = [];

  if (supabaseClient && user) {
    const { data: cData } = await supabaseClient.from('study_courses').select('*').eq('user_id', user.id);
    const { data: tData } = await supabaseClient.from('study_topics').select('*');
    const { data: sData } = await supabaseClient.from('study_sessions').select('*').eq('user_id', user.id);
    courses = cData || [];
    topics = tData || [];
    sessions = sData || [];
  } else {
    courses = localDb.get('study_courses');
    topics = localDb.get('study_topics');
    sessions = localDb.get('study_sessions');
  }

  // Horas estudiadas totales
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>📚 Control de Estudios</h1>
        <p>Gestiona tus cursos, contenidos temáticos y registra tu tiempo de aprendizaje.</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button id="btn-open-session-modal" class="btn btn-secondary">+ Registrar Sesión</button>
        <button id="btn-open-course-modal" class="btn btn-primary">+ Nuevo Curso</button>
      </div>
    </div>

    <!-- Métrica Total Horas -->
    <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, rgba(30, 40, 62, 0.8), rgba(24, 32, 50, 0.9)); border-left: 4px solid var(--accent-primary);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase;">⏱️ Horas de Estudio Invertidas</div>
          <div style="font-size: 2.2rem; font-weight: 700; color: var(--text-main); margin-top: 0.2rem;">${totalHours} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;">Horas Totales</span></div>
        </div>
        <div style="font-size: 2.5rem; opacity: 0.8;">🎓</div>
      </div>
    </div>

    <!-- Grid de Cursos -->
    <div class="grid-2" id="courses-list-container">
      <!-- Cursos dinámicos -->
    </div>

    <!-- Modal Nuevo Curso -->
    <div id="course-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Curso de Estudio</h3>
          <button class="btn-close-modal" id="btn-close-course-modal">&times;</button>
        </div>
        <form id="course-form">
          <div class="form-group">
            <label class="form-label">Nombre del Curso *</label>
            <input type="text" id="course-name" class="form-control" placeholder="Ej: Bases de Datos PostgreSQL, React & Next.js..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción / Objetivos</label>
            <textarea id="course-description" class="form-control" placeholder="Temas clave a dominar..."></textarea>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-course">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Curso</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Registrar Sesión de Estudio -->
    <div id="session-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Registrar Sesión de Estudio</h3>
          <button class="btn-close-modal" id="btn-close-session-modal">&times;</button>
        </div>
        <form id="session-form">
          <div class="form-group">
            <label class="form-label">Curso</label>
            <select id="session-course-id" class="form-control" required>
              ${courses.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duración (Minutos)</label>
              <input type="number" id="session-duration" class="form-control" value="60" min="5" step="5" required />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" id="session-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-session">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Sesión</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderCoursesList() {
    const listEl = container.querySelector('#courses-list-container');
    if (courses.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📚</div>
          <h3>Sin Cursos Creados</h3>
          <p>Agrega un curso para desglosar sus temas y registrar tus sesiones de aprendizaje.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = courses.map(c => {
      const courseTopics = topics.filter(t => t.course_id === c.id);
      const completedTopics = courseTopics.filter(t => t.completed);
      const progress = courseTopics.length > 0 ? Math.round((completedTopics.length / courseTopics.length) * 100) : c.progress || 0;

      const courseSessions = sessions.filter(s => s.course_id === c.id);
      const courseMins = courseSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(c.name)}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(c.description || '')}</p>
            </div>
            <button class="btn btn-danger btn-sm btn-delete-course" data-id="${c.id}">🗑️</button>
          </div>

          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
              <span>Avance del Temario</span>
              <strong>${progress}%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${progress}%; height: 100%; background: var(--accent-primary);"></div>
            </div>
          </div>

          <!-- Temas Checkable -->
          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">📖 Temario del Curso</div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 120px; overflow-y: auto;">
              ${courseTopics.map(t => `
                <label style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" class="topic-check" data-id="${t.id}" ${t.completed ? 'checked' : ''} />
                  <span style="${t.completed ? 'text-decoration: line-through; color: var(--text-dim);' : ''}">${escapeHtml(t.name)}</span>
                </label>
              `).join('')}
            </div>

            <!-- Input agregar tema rápido -->
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <input type="text" class="form-control input-new-topic" data-course-id="${c.id}" placeholder="+ Agregar nuevo tema..." style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" />
              <button class="btn btn-secondary btn-sm btn-add-topic" data-course-id="${c.id}">Añadir</button>
            </div>
          </div>

          <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-dim); display: flex; justify-content: space-between;">
            <span>⏱️ ${courseMins} minutos estudiados</span>
            <span>${completedTopics.length}/${courseTopics.length} temas completados</span>
          </div>
        </div>
      `;
    }).join('');

    // Topic listeners
    listEl.querySelectorAll('.topic-check').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const completed = e.target.checked;
        if (supabaseClient && user) {
          await supabaseClient.from('study_topics').update({ completed }).eq('id', id);
        } else {
          localDb.update('study_topics', id, { completed });
        }
        renderStudy(container);
      });
    });

    listEl.querySelectorAll('.btn-add-topic').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const courseId = e.currentTarget.dataset.courseId;
        const input = container.querySelector(`.input-new-topic[data-course-id="${courseId}"]`);
        const topicName = input.value.trim();
        if (!topicName) return;

        const topicData = { course_id: courseId, name: topicName, completed: false };
        if (supabaseClient && user) {
          await supabaseClient.from('study_topics').insert([topicData]);
        } else {
          localDb.insert('study_topics', topicData);
        }
        showToast('Tema agregado', 'success');
        renderStudy(container);
      });
    });

    listEl.querySelectorAll('.btn-delete-course').forEach(btn => {
      btn.addEventListener('click', (e) => deleteCourse(e.currentTarget.dataset.id));
    });
  }

  // Modales
  const cModal = container.querySelector('#course-modal');
  const sModal = container.querySelector('#session-modal');

  container.querySelector('#btn-open-course-modal').addEventListener('click', () => cModal.classList.add('active'));
  container.querySelector('#btn-close-course-modal').addEventListener('click', () => cModal.classList.remove('active'));
  container.querySelector('#btn-cancel-course').addEventListener('click', () => cModal.classList.remove('active'));

  container.querySelector('#btn-open-session-modal').addEventListener('click', () => sModal.classList.add('active'));
  container.querySelector('#btn-close-session-modal').addEventListener('click', () => sModal.classList.remove('active'));
  container.querySelector('#btn-cancel-session').addEventListener('click', () => sModal.classList.remove('active'));

  container.querySelector('#course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: container.querySelector('#course-name').value.trim(),
      description: container.querySelector('#course-description').value.trim(),
      user_id: user?.id
    };
    if (supabaseClient && user) {
      await supabaseClient.from('study_courses').insert([data]);
    } else {
      localDb.insert('study_courses', data);
    }
    showToast('Curso creado', 'success');
    cModal.classList.remove('active');
    renderStudy(container);
  });

  container.querySelector('#session-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      course_id: container.querySelector('#session-course-id').value,
      duration_minutes: parseInt(container.querySelector('#session-duration').value),
      date: container.querySelector('#session-date').value,
      user_id: user?.id
    };
    if (supabaseClient && user) {
      await supabaseClient.from('study_sessions').insert([data]);
    } else {
      localDb.insert('study_sessions', data);
    }
    showToast('Sesión de estudio guardada', 'success');
    sModal.classList.remove('active');
    renderStudy(container);
  });

  function deleteCourse(id) {
    confirmAction('Eliminar Curso', '¿Estás seguro de eliminar este curso y todos sus temas/sesiones?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('study_courses').delete().eq('id', id);
      } else {
        localDb.delete('study_courses', id);
      }
      showToast('Curso eliminado', 'info');
      renderStudy(container);
    });
  }

  renderCoursesList();
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
