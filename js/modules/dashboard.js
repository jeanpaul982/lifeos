// ==========================================
// LIFEOS - DASHBOARD MODULE & WHAT SHOULD I DO NOW ALGORITHM
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { startFocusModeForTask } from './focus.js';

export async function renderDashboard(container) {
  const user = getCurrentUser();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  
  // Obtener fecha actual
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('es-ES', options);
  
  // Saludo según hora del día
  const hours = now.getHours();
  let greeting = "Buenos días";
  if (hours >= 12 && hours < 19) greeting = "Buenas tardes";
  if (hours >= 19 || hours < 5) greeting = "Buenas noches";

  // Cargar Tareas y Objetivos
  let tasks = [];
  let goals = [];

  if (supabaseClient && user) {
    const { data: tasksData } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id);
    const { data: goalsData } = await supabaseClient.from('goals').select('*').eq('user_id', user.id);
    tasks = tasksData || [];
    goals = goalsData || [];
  } else {
    tasks = localDb.get('tasks');
    goals = localDb.get('goals');
  }

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETADO');
  const mainGoal = goals.find(g => g.level === 'GRANDE' || g.status === 'EN_PROGRESO') || goals[0];

  // Algoritmo: ¿Qué debería hacer ahora?
  const nextTask = calculateNextAction(pendingTasks, goals);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>${greeting}, ${escapeHtml(userName)} 👋</h1>
        <p>Hoy es ${dateStr}. Aquí está tu resumen de enfoque.</p>
      </div>
    </div>

    <div class="grid-3" style="margin-bottom: 2rem;">
      <!-- Tarjeta Objetivo Principal -->
      <div class="card" style="border-left: 4px solid var(--accent-purple);">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-purple); text-transform: uppercase; margin-bottom: 0.4rem;">🎯 Objetivo Principal</div>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.3rem;">${mainGoal ? escapeHtml(mainGoal.title) : 'Sin Objetivo Definido'}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">${mainGoal ? escapeHtml(mainGoal.description || '') : 'Crea tu primer objetivo para enfocar tu día.'}</p>
        ${mainGoal ? `
          <div style="margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
            <span>Progreso: ${mainGoal.progress || 0}%</span>
            <span class="badge badge-medium">${mainGoal.level || 'SEMANAL'}</span>
          </div>
        ` : ''}
      </div>

      <!-- Tarjeta Resumen Pendientes -->
      <div class="card" style="border-left: 4px solid var(--accent-primary);">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: 0.4rem;">📋 Tareas Pendientes</div>
        <div style="font-size: 2.2rem; font-weight: 700; color: var(--text-main);">${pendingTasks.length}</div>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Acciones requeridas para completar tus objetivos del día.</p>
      </div>

      <!-- Tarjeta Estado de Productividad -->
      <div class="card" style="border-left: 4px solid var(--accent-success);">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-success); text-transform: uppercase; margin-bottom: 0.4rem;">🔥 Sistema Enfoque</div>
        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem;">LIFEOS Activo</div>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Modo de optimización constante y priorización activado.</p>
      </div>
    </div>

    <!-- SECCIÓN CRÍTICA: ¿QUÉ HAGO AHORA? -->
    <div class="card next-action-hero" style="margin-bottom: 2rem;">
      <div class="next-action-tag">
        <span>⚡</span> SIGUIENTE ACCIÓN RECOMENDADA
      </div>
      
      ${nextTask ? `
        <h2 class="next-action-title">${escapeHtml(nextTask.title)}</h2>
        <p style="color: var(--text-muted); margin-bottom: 1rem; max-width: 700px;">${escapeHtml(nextTask.description || 'Sin descripción detallada.')}</p>

        <div class="next-action-meta">
          <div>⏱️ <strong>${nextTask.estimated_minutes || 30} minutos</strong></div>
          <div>🏷️ Categoría: <strong>${nextTask.category || 'General'}</strong></div>
          <div>🔥 Prioridad: <span class="badge ${getPriorityBadgeClass(nextTask.priority)}">${nextTask.priority}</span></div>
          ${nextTask.goalTitle ? `<div>🎯 Objetivo: <strong>${escapeHtml(nextTask.goalTitle)}</strong></div>` : ''}
        </div>

        <button id="btn-start-next-action" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 1rem;">
          🚀 [ EMPEZAR AHORA ]
        </button>
      ` : `
        <h2 class="next-action-title">🎉 ¡Todo al día! No tienes tareas pendientes.</h2>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Aprovecha para descansar o crear una nueva tarea para tus objetivos.</p>
        <button id="btn-add-task-from-dash" class="btn btn-primary">+ Crear Nueva Tarea</button>
      `}
    </div>
  `;

  // Listener para Empezar Modo Enfoque con la tarea recomendada
  if (nextTask) {
    const btnStart = container.querySelector('#btn-start-next-action');
    btnStart?.addEventListener('click', () => {
      startFocusModeForTask(nextTask);
    });
  }

  const btnAdd = container.querySelector('#btn-add-task-from-dash');
  btnAdd?.addEventListener('click', () => {
    document.getElementById('btn-global-quick-add')?.click();
  });
}

// ALGORITMO INTELIGENTE "¿QUÉ HAGO AHORA?"
function calculateNextAction(tasks, goals) {
  if (tasks.length === 0) return null;

  const priorityWeights = { 'URGENTE': 100, 'ALTA': 75, 'MEDIA': 50, 'BAJA': 25 };
  const goalMap = new Map(goals.map(g => [g.id, g]));

  const scoredTasks = tasks.map(task => {
    let score = 0;

    // 1. Ponderación por prioridad
    score += priorityWeights[task.priority] || 50;

    // 2. Ponderación por fecha límite
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const diffHours = (dueDate - new Date()) / (1000 * 60 * 60);
      if (diffHours < 0) score += 120; // Tarea vencida
      else if (diffHours <= 24) score += 80; // Vence hoy
      else if (diffHours <= 72) score += 40; // Vence pronto
    }

    // 3. Ponderación por objetivo asociado
    if (task.goal_id && goalMap.has(task.goal_id)) {
      const goal = goalMap.get(task.goal_id);
      if (goal.level === 'GRANDE') score += 60;
      else if (goal.level === 'MENSUAL') score += 40;
      else score += 20;
      task.goalTitle = goal.title;
    }

    // 4. Factor de duración (preferir tareas manejables)
    if (task.estimated_minutes && task.estimated_minutes <= 50) {
      score += 15;
    }

    return { task, score };
  });

  // Ordenar de mayor a menor puntaje
  scoredTasks.sort((a, b) => b.score - a.score);

  return scoredTasks[0].task;
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'URGENTE': return 'badge-urgent';
    case 'ALTA': return 'badge-high';
    case 'MEDIA': return 'badge-medium';
    default: return 'badge-low';
  }
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
