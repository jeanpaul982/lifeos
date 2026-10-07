// ==========================================
// LIFEOS - FOCUS MODE MODULE (POMODORO TIMER & SESSIONS)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast } from '../components/notifications.js';

let timerInterval = null;
let timeRemaining = 25 * 60; // 25 min default
let totalDuration = 25;
let isRunning = false;
let selectedTask = null;
let sessionStartTime = null;

export async function renderFocus(container, preselectedTask = null) {
  const user = getCurrentUser();
  let tasks = [];

  if (supabaseClient && user) {
    const { data } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id).eq('status', 'PENDIENTE');
    tasks = data || [];
  } else {
    tasks = localDb.get('tasks').filter(t => t.status === 'PENDIENTE');
  }

  if (preselectedTask) {
    selectedTask = preselectedTask;
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>⚡ Modo Enfoque Pomodoro</h1>
        <p>Elimina distracciones y concéntrate en bloques de trabajo hiper-enfocados.</p>
      </div>
    </div>

    <div class="card" style="max-width: 650px; margin: 0 auto; text-align: center; padding: 2.5rem 1.5rem;">
      <!-- Selección de Duración -->
      <div style="display: flex; justify-content: center; gap: 0.75rem; margin-bottom: 1.5rem;">
        <button class="btn btn-secondary btn-timer-preset ${totalDuration === 25 ? 'btn-primary' : ''}" data-mins="25">25 Minutos</button>
        <button class="btn btn-secondary btn-timer-preset ${totalDuration === 50 ? 'btn-primary' : ''}" data-mins="50">50 Minutos</button>
        <button class="btn btn-secondary btn-timer-preset ${totalDuration === 90 ? 'btn-primary' : ''}" data-mins="90">90 Minutos</button>
      </div>

      <!-- Tarea Seleccionada -->
      <div style="margin-bottom: 2rem; background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md);">
        <label class="form-label" style="margin-bottom: 0.5rem; display: block;">Vincular Tarea (Opcional)</label>
        <select id="focus-task-select" class="form-control" style="max-width: 400px; margin: 0 auto;">
          <option value="">-- Trabajo Libre sin Tarea Especifica --</option>
          ${tasks.map(t => `<option value="${t.id}" ${selectedTask?.id === t.id ? 'selected' : ''}>${escapeHtml(t.title)} (${t.category})</option>`).join('')}
        </select>
      </div>

      <!-- Display del Reloj Timer -->
      <div id="timer-display" style="font-family: var(--font-heading); font-size: 5rem; font-weight: 700; color: var(--accent-primary); letter-spacing: 0.05em; margin-bottom: 2rem; text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);">
        ${formatTime(timeRemaining)}
      </div>

      <!-- Botones de Control -->
      <div style="display: flex; justify-content: center; gap: 1rem;">
        <button id="btn-timer-toggle" class="btn btn-primary" style="padding: 0.8rem 2.5rem; font-size: 1.1rem;">
          ${isRunning ? '⏸️ Pausar' : '▶️ Iniciar Enfoque'}
        </button>
        <button id="btn-timer-reset" class="btn btn-secondary" style="padding: 0.8rem 1.5rem; font-size: 1rem;">
          🔄 Reiniciar
        </button>
      </div>
    </div>
  `;

  const displayEl = container.querySelector('#timer-display');
  const toggleBtn = container.querySelector('#btn-timer-toggle');
  const resetBtn = container.querySelector('#btn-timer-reset');
  const presets = container.querySelectorAll('.btn-timer-preset');
  const taskSelect = container.querySelector('#focus-task-select');

  // Presets handlers
  presets.forEach(pBtn => {
    pBtn.addEventListener('click', (e) => {
      if (isRunning) return;
      presets.forEach(b => b.classList.remove('btn-primary'));
      presets.forEach(b => b.classList.add('btn-secondary'));
      e.currentTarget.classList.add('btn-primary');
      e.currentTarget.classList.remove('btn-secondary');

      totalDuration = parseInt(e.currentTarget.dataset.mins);
      timeRemaining = totalDuration * 60;
      displayEl.textContent = formatTime(timeRemaining);
    });
  });

  taskSelect.addEventListener('change', (e) => {
    const tId = e.target.value;
    selectedTask = tasks.find(t => t.id === tId) || null;
  });

  toggleBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', () => {
    pauseTimer();
    timeRemaining = totalDuration * 60;
    displayEl.textContent = formatTime(timeRemaining);
  });

  function startTimer() {
    isRunning = true;
    sessionStartTime = new Date().toISOString();
    toggleBtn.textContent = '⏸️ Pausar';
    toggleBtn.classList.replace('btn-primary', 'btn-secondary');
    playAudioBeep(600);

    timerInterval = setInterval(() => {
      timeRemaining--;
      displayEl.textContent = formatTime(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        completeSession();
      }
    }, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    toggleBtn.textContent = '▶️ Reanudar';
    toggleBtn.classList.replace('btn-secondary', 'btn-primary');
  }

  async function completeSession() {
    playAudioBeep(880);
    showToast(`¡Sesión de ${totalDuration} minutos completada con éxito! 🎉`, 'success');

    const sessionData = {
      task_id: selectedTask ? selectedTask.id : null,
      started_at: sessionStartTime,
      ended_at: new Date().toISOString(),
      duration_minutes: totalDuration,
      user_id: user?.id
    };

    if (supabaseClient && user) {
      await supabaseClient.from('focus_sessions').insert([sessionData]);
    } else {
      localDb.insert('focus_sessions', sessionData);
    }

    // Reiniciar
    timeRemaining = totalDuration * 60;
    displayEl.textContent = formatTime(timeRemaining);
    toggleBtn.textContent = '▶️ Iniciar Enfoque';
  }
}

export function startFocusModeForTask(task) {
  selectedTask = task;
  const navFocus = document.querySelector('[data-view="focus"]');
  if (navFocus) navFocus.click();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function playAudioBeep(freq = 440) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio Context no soportado o bloqueado
  }
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
