/* ==========================================================================
   LIFEOS - COMPLETE AUTOCONTAINED APPLICATION ENGINE WITH VISIBLE AUTHENTICATION
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. CONFIGURATION & SYSTEM CONSTANTS
// --------------------------------------------------------------------------
const SUPABASE_URL = "https://gtqrrqycruglpuojqavx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cXJycXljcnVnbHB1b2pxYXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODk3ODksImV4cCI6MjEwNjk2NTc4OX0.6iLmEz9v9J6Iki6w6gAX0DaQtt7rOhqOhU-l32B9BGM";

const IS_SUPABASE_CONFIGURED = 
  SUPABASE_URL !== "https://YOUR_SUPABASE_PROJECT_ID.supabase.co" && 
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" &&
  SUPABASE_URL.trim() !== "" &&
  SUPABASE_ANON_KEY.trim() !== "";

const CATEGORIES = ['Estudios', 'Gym', 'Deporte', 'Hábitos', 'Proyectos', 'Startup', 'Personal'];

const PRIORITIES = [
  { id: 'BAJA', label: 'Baja', class: 'badge-low' },
  { id: 'MEDIA', label: 'Media', class: 'badge-medium' },
  { id: 'ALTA', label: 'Alta', class: 'badge-high' },
  { id: 'URGENTE', label: 'Urgente', class: 'badge-urgent' }
];

const GOAL_LEVELS = ['GRANDE', 'MENSUAL', 'SEMANAL'];

const STARTUP_STAGES = [
  'IDEA',
  'VALIDACIÓN',
  'MVP',
  'PRIMER USUARIO',
  'PRIMER CLIENTE',
  'INGRESOS'
];

// --------------------------------------------------------------------------
// 2. SUPABASE CLIENT & LOCAL DATABASE ENGINE
// --------------------------------------------------------------------------
let supabaseClient = null;

if (IS_SUPABASE_CONFIGURED && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("⚡ Supabase conectado exitosamente.");
  } catch (err) {
    console.warn("⚠️ Error inicializando Supabase, activando LocalStorage DB fallback.");
  }
}

class LocalDatabase {
  constructor() {
    this.prefix = "lifeos_local_";
  }

  get(table) {
    const data = localStorage.getItem(this.prefix + table);
    return data ? JSON.parse(data) : [];
  }

  set(table, items) {
    localStorage.setItem(this.prefix + table, JSON.stringify(items));
  }

  insert(table, item) {
    const items = this.get(table);
    const newItem = {
      id: item.id || (crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).substr(2, 9)),
      created_at: new Date().toISOString(),
      ...item
    };
    items.unshift(newItem);
    this.set(table, items);
    return newItem;
  }

  update(table, id, updates) {
    const items = this.get(table);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(table, items);
      return items[index];
    }
    return null;
  }

  delete(table, id) {
    let items = this.get(table);
    items = items.filter(i => i.id !== id);
    this.set(table, items);
    return true;
  }

  exportBackupJSON() {
    const tables = ['tasks', 'goals', 'habits', 'habit_logs', 'focus_sessions', 'study_courses', 'study_topics', 'study_sessions', 'workouts', 'workout_exercises', 'sports_sessions', 'projects', 'project_tasks', 'startup_workspaces', 'startup_members', 'startup_roadmap', 'startup_products', 'startup_tasks'];
    const backup = {};
    tables.forEach(t => backup[t] = this.get(t));
    return JSON.stringify(backup, null, 2);
  }
}

const localDb = new LocalDatabase();

function seedLocalDemoData() {
  if (localDb.get('tasks').length === 0) {
    localDb.set('tasks', [
      {
        id: 't-1',
        title: "Estudiar SQL y Normalización de BD",
        description: "Repasar llaves primarias, foráneas, índices y Row Level Security",
        priority: "ALTA",
        category: "Estudios",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        estimated_minutes: 50,
        status: "PENDIENTE",
        created_at: new Date().toISOString()
      },
      {
        id: 't-2',
        title: "Rutina Gym - Pecho y Tríceps",
        description: "4 series de Press Plano (70kg), 3 series de Fondos",
        priority: "MEDIA",
        category: "Gym",
        due_date: new Date().toISOString(),
        estimated_minutes: 60,
        status: "PENDIENTE",
        created_at: new Date().toISOString()
      },
      {
        id: 't-3',
        title: "Meditar 10 minutos por la mañana",
        description: "Hábito diario de atención plena",
        priority: "BAJA",
        category: "Hábitos",
        due_date: new Date().toISOString(),
        estimated_minutes: 10,
        status: "COMPLETADO",
        created_at: new Date().toISOString()
      }
    ]);

    localDb.set('goals', [
      {
        id: 'g-1',
        title: "Dominar Arquitectura de Bases de Datos",
        description: "Aprender PostgreSQL, RLS y optimizaciones",
        category: "Estudios",
        level: "GRANDE",
        progress: 40,
        status: "EN_PROGRESO",
        created_at: new Date().toISOString()
      },
      {
        id: 'g-2',
        title: "Aumentar masa muscular 2kg",
        description: "Entrenamiento de fuerza 4 veces por semana",
        category: "Gym",
        level: "MENSUAL",
        progress: 60,
        status: "EN_PROGRESO",
        created_at: new Date().toISOString()
      }
    ]);

    localDb.set('habits', [
      { id: 'h-1', name: "Leer 20 páginas de libro técnico", frequency: "DIARIO", active: true },
      { id: 'h-2', name: "Beber 2.5 litros de Agua", frequency: "DIARIO", active: true },
      { id: 'h-3', name: "Entrenamiento Gym de Fuerza", frequency: "DIARIO", active: true }
    ]);

    localDb.set('study_courses', [
      { id: 'c-1', name: "Bases de Datos & PostgreSQL", description: "Modelado relacional y RLS", progress: 60 }
    ]);

    localDb.set('study_topics', [
      { id: 'top-1', course_id: 'c-1', name: "Llaves Primarias y Foráneas", completed: true },
      { id: 'top-2', course_id: 'c-1', name: "Políticas de Row Level Security (RLS)", completed: true },
      { id: 'top-3', course_id: 'c-1', name: "Índices B-Tree y Triggers", completed: false }
    ]);

    localDb.set('study_sessions', [
      { id: 's-1', course_id: 'c-1', duration_minutes: 90, date: new Date().toISOString().split('T')[0] }
    ]);

    localDb.set('workouts', [
      { id: 'w-1', name: "Pecho & Tríceps Hipertrofia", date: new Date().toISOString().split('T')[0] }
    ]);

    localDb.set('workout_exercises', [
      { id: 'we-1', workout_id: 'w-1', exercise: "Press de Banca Plano", sets: 4, reps: 10, weight: 70 },
      { id: 'we-2', workout_id: 'w-1', exercise: "Fondos en Paralelas", sets: 3, reps: 12, weight: 0 }
    ]);

    localDb.set('sports_sessions', [
      { id: 'sp-1', sport: "Fútbol 7", duration_minutes: 60, intensity: "ALTA", date: new Date().toISOString().split('T')[0], notes: "Gran partido, 2 goles." }
    ]);

    localDb.set('projects', [
      { id: 'p-1', name: "LIFEOS App Web", description: "Sistema Operativo Personal de Productividad", status: "DESARROLLO", priority: "ALTA", progress: 80 }
    ]);

    localDb.set('project_tasks', [
      { id: 'pt-1', project_id: 'p-1', title: "Estructura HTML5 y CSS3 SaaS Dark Mode", status: "COMPLETADO" },
      { id: 'pt-2', project_id: 'p-1', title: "Integración con Supabase y RLS", status: "COMPLETADO" },
      { id: 'pt-3', project_id: 'p-1', title: "Algoritmo ¿Qué Hago Ahora?", status: "COMPLETADO" }
    ]);

    localDb.set('startup_workspaces', [
      { id: 'ws-1', name: "Mi Startup Hub", description: "Espacio de aceleración para mi emprendimiento." }
    ]);

    localDb.set('startup_members', [
      { id: 'm-1', workspace_id: 'ws-1', name: "Jean (Fundador)", role: "CEO", email: "jean@startup.com" },
      { id: 'm-2', workspace_id: 'ws-1', name: "Alex Rivera", role: "CTO", email: "alex@startup.com" }
    ]);

    localDb.set('startup_roadmap', [
      { id: 'rm-1', workspace_id: 'ws-1', stage: "IDEA", status: "ALCANZADO", notes: "Concepto de LIFEOS definido." },
      { id: 'rm-2', workspace_id: 'ws-1', stage: "VALIDACIÓN", status: "EN_PROGRESO", notes: "Entrevistas con usuarios en curso." }
    ]);

    localDb.set('startup_products', [
      { id: 'pr-1', workspace_id: 'ws-1', title: "Motor de Algoritmo de Priorización", type: "FEATURE", priority: "ALTA", status: "EN_DESARROLLO" }
    ]);

    localDb.set('startup_tasks', [
      { id: 'st-1', workspace_id: 'ws-1', title: "Diseñar Landing Page de Captación", assigned_member_id: 'm-2', status: "PENDIENTE" }
    ]);
  }
}

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

// --------------------------------------------------------------------------
// 3. NOTIFICATIONS & CONFIRMATIONS
// --------------------------------------------------------------------------
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  if (type === 'success') playSuccessChime();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function confirmAction(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 420px; text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
      <h3 style="margin-bottom: 0.5rem; font-family: var(--font-heading);">${escapeHtml(title)}</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">${escapeHtml(message)}</p>
      <div style="display: flex; gap: 0.75rem; justify-content: center;">
        <button id="btn-confirm-cancel" class="btn btn-secondary">Cancelar</button>
        <button id="btn-confirm-ok" class="btn btn-danger">Confirmar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#btn-confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#btn-confirm-ok').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

// --------------------------------------------------------------------------
// 4. AUTHENTICATION MODULE (LOGIN, REGISTER & SESSION HANDLER)
// --------------------------------------------------------------------------
let currentUser = null;

async function initAuth(onAuthChange) {
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) currentUser = session.user;
    
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      onAuthChange(currentUser);
    });

    onAuthChange(currentUser);
  } else {
    // Modo Local: verificar si hay sesión guardada en localStorage
    const savedUser = localStorage.getItem('lifeos_active_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
    } else {
      currentUser = null; // Requerir autenticación explícita por defecto
    }
    onAuthChange(currentUser);
  }
}

function getCurrentUser() {
  return currentUser;
}

async function loginUser(email, password) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    return currentUser;
  } else {
    // Login Local
    currentUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email,
      user_metadata: { full_name: email.split('@')[0] }
    };
    localStorage.setItem('lifeos_active_user', JSON.stringify(currentUser));
    return currentUser;
  }
}

async function registerUser(email, password, fullName) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    currentUser = data.user;
    return currentUser;
  } else {
    // Registro Local
    currentUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email,
      user_metadata: { full_name: fullName }
    };
    localStorage.setItem('lifeos_active_user', JSON.stringify(currentUser));
    return currentUser;
  }
}

async function resetPassword(email) {
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } else {
    showToast(`Enlace enviado a ${email} (Modo Demo)`, 'info');
  }
}

async function logoutUser() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  } else {
    localStorage.removeItem('lifeos_active_user');
  }
  currentUser = null;
  window.location.reload();
}

// --------------------------------------------------------------------------
// 5. DASHBOARD & QUICK HABITS WIDGET
// --------------------------------------------------------------------------
async function renderDashboard(container) {
  const user = getCurrentUser();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('es-ES', options);
  const todayStr = now.toISOString().split('T')[0];

  const hours = now.getHours();
  let greeting = "Buenos días";
  if (hours >= 12 && hours < 19) greeting = "Buenas tardes";
  if (hours >= 19 || hours < 5) greeting = "Buenas noches";

  let tasks = [];
  let goals = [];
  let habits = [];
  let habitLogs = [];

  if (supabaseClient && user) {
    const { data: tasksData } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id);
    const { data: goalsData } = await supabaseClient.from('goals').select('*').eq('user_id', user.id);
    const { data: habitsData } = await supabaseClient.from('habits').select('*').eq('user_id', user.id);
    const { data: logsData } = await supabaseClient.from('habit_logs').select('*').eq('user_id', user.id);
    tasks = tasksData || [];
    goals = goalsData || [];
    habits = habitsData || [];
    habitLogs = logsData || [];
  } else {
    tasks = localDb.get('tasks');
    goals = localDb.get('goals');
    habits = localDb.get('habits');
    habitLogs = localDb.get('habit_logs');
  }

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETADO');
  const mainGoal = goals.find(g => g.level === 'GRANDE' || g.status === 'EN_PROGRESO') || goals[0];
  const nextTask = calculateNextAction(pendingTasks, goals);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>${greeting}, ${escapeHtml(userName)} 👋</h1>
        <p>Hoy es ${dateStr}. Bienvenido a tu centro de control personal.</p>
      </div>
      <button id="btn-export-backup" class="btn btn-secondary btn-sm" title="Respaldar Datos en JSON">💾 Respaldar Datos (Backup)</button>
    </div>

    <div class="grid-3" style="margin-bottom: 2rem;">
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

      <div class="card" style="border-left: 4px solid var(--accent-primary);">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: 0.4rem;">📋 Tareas Pendientes</div>
        <div style="font-size: 2.2rem; font-weight: 700; color: var(--text-main);">${pendingTasks.length}</div>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Acciones requeridas para avanzar hoy.</p>
      </div>

      <div class="card" style="border-left: 4px solid var(--accent-success);">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-success); text-transform: uppercase; margin-bottom: 0.4rem;">🔥 Sistema Enfoque</div>
        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem;">LIFEOS v1.0 Activo</div>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Algoritmo de priorización en ejecución.</p>
      </div>
    </div>

    <!-- ALGORITMO ¿QUÉ HAGO AHORA? -->
    <div class="card next-action-hero" style="margin-bottom: 2rem;">
      <div class="next-action-tag">
        <span>⚡</span> SIGUIENTE ACCIÓN RECOMENDADA POR ALGORITMO
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
          🚀 [ EMPEZAR EN MODO ENFOQUE ]
        </button>
      ` : `
        <h2 class="next-action-title">🎉 ¡Todo al día! No tienes tareas pendientes.</h2>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Crea nuevas tareas o descansa.</p>
        <button id="btn-add-task-from-dash" class="btn btn-primary">+ Crear Tarea</button>
      `}
    </div>

    <!-- WIDGET RÁPIDO DE HÁBITOS DE HOY -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.1rem; font-family: var(--font-heading);">🧠 Hábitos de Hoy</h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Acceso rápido</span>
      </div>

      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        ${habits.map(h => {
          const isDone = habitLogs.some(l => l.habit_id === h.id && l.date === todayStr && l.completed);
          return `
            <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary); padding: 0.6rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <input type="checkbox" class="dash-habit-check" data-id="${h.id}" ${isDone ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              <span style="${isDone ? 'text-decoration: line-through; color: var(--text-dim);' : 'font-weight: 600;'}">${escapeHtml(h.name)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  if (nextTask) {
    container.querySelector('#btn-start-next-action')?.addEventListener('click', () => navigateTo('focus'));
  }

  container.querySelector('#btn-add-task-from-dash')?.addEventListener('click', () => {
    document.getElementById('btn-global-quick-add')?.click();
  });

  container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
    const backupStr = localDb.exportBackupJSON();
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos_backup_${todayStr}.json`;
    a.click();
    showToast('Respaldo exportado exitosamente 💾', 'success');
  });

  container.querySelectorAll('.dash-habit-check').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const habitId = e.target.dataset.id;
      const completed = e.target.checked;
      if (supabaseClient && user) {
        if (completed) await supabaseClient.from('habit_logs').upsert([{ habit_id: habitId, user_id: user.id, date: todayStr, completed: true }]);
        else await supabaseClient.from('habit_logs').delete().eq('habit_id', habitId).eq('date', todayStr);
      } else {
        let logs = localDb.get('habit_logs');
        if (completed) logs.unshift({ id: 'hl_' + Date.now(), habit_id: habitId, user_id: user?.id, date: todayStr, completed: true });
        else logs = logs.filter(l => !(l.habit_id === habitId && l.date === todayStr));
        localDb.set('habit_logs', logs);
      }
      showToast(completed ? '¡Hábito marcado para hoy! 🔥' : 'Hábito desmarcado', 'success');
      renderDashboard(container);
    });
  });
}

function calculateNextAction(tasks, goals) {
  if (tasks.length === 0) return null;
  const priorityWeights = { 'URGENTE': 100, 'ALTA': 75, 'MEDIA': 50, 'BAJA': 25 };
  const goalMap = new Map(goals.map(g => [g.id, g]));

  const scoredTasks = tasks.map(task => {
    let score = 0;
    score += priorityWeights[task.priority] || 50;

    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const diffHours = (dueDate - new Date()) / (1000 * 60 * 60);
      if (diffHours < 0) score += 120;
      else if (diffHours <= 24) score += 80;
      else if (diffHours <= 72) score += 40;
    }

    if (task.goal_id && goalMap.has(task.goal_id)) {
      const goal = goalMap.get(task.goal_id);
      if (goal.level === 'GRANDE') score += 60;
      else if (goal.level === 'MENSUAL') score += 40;
      else score += 20;
      task.goalTitle = goal.title;
    }

    if (task.estimated_minutes && task.estimated_minutes <= 50) {
      score += 15;
    }

    return { task, score };
  });

  scoredTasks.sort((a, b) => b.score - a.score);
  return scoredTasks[0].task;
}

// --------------------------------------------------------------------------
// 6. TASKS MODULE (FULL CRUD)
// --------------------------------------------------------------------------
async function renderTasks(container) {
  const user = getCurrentUser();
  let tasks = [];
  let goals = [];

  if (supabaseClient && user) {
    const { data: tData } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: gData } = await supabaseClient.from('goals').select('*').eq('user_id', user.id);
    tasks = tData || [];
    goals = gData || [];
  } else {
    tasks = localDb.get('tasks');
    goals = localDb.get('goals');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>✅ Gestión de Tareas</h1>
        <p>Organiza, prioriza y completa tus acciones diarias.</p>
      </div>
      <button id="btn-open-task-modal" class="btn btn-primary">+ Nueva Tarea</button>
    </div>

    <div class="card" style="margin-bottom: 1.5rem; padding: 1rem;">
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
          <select id="filter-status" class="form-control" style="width: 150px;">
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="COMPLETADO">Completadas</option>
          </select>
          <select id="filter-category" class="form-control" style="width: 160px;">
            <option value="TODAS">Todas las Categorías</option>
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <select id="filter-priority" class="form-control" style="width: 150px;">
            <option value="TODAS">Todas las Prioridades</option>
            ${PRIORITIES.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
          </select>
        </div>
        <select id="sort-by" class="form-control" style="width: 170px;">
          <option value="FECHA_CREACION">Más Recientes</option>
          <option value="PRIORIDAD">Por Prioridad</option>
          <option value="DURACION">Por Duración</option>
        </select>
      </div>
    </div>

    <div id="tasks-list-container" class="grid-2"></div>

    <div id="task-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="task-modal-title">Nueva Tarea</h3>
          <button class="btn-close-modal" id="btn-close-task-modal">&times;</button>
        </div>
        <form id="task-form">
          <input type="hidden" id="task-id" />
          <div class="form-group">
            <label class="form-label">Título de la Tarea *</label>
            <input type="text" id="task-title" class="form-control" placeholder="Ej: Estudiar SQL, Entrenar piernas..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="task-description" class="form-control" placeholder="Detalles sobre la tarea..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select id="task-category" class="form-control">
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad</label>
              <select id="task-priority" class="form-control">
                ${PRIORITIES.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duración (minutos)</label>
              <input type="number" id="task-minutes" class="form-control" value="30" min="5" step="5" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Límite</label>
              <input type="date" id="task-due-date" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Vinculado a Objetivo</label>
            <select id="task-goal" class="form-control">
              <option value="">-- Ninguno --</option>
              ${goals.map(g => `<option value="${g.id}">${escapeHtml(g.title)} (${g.level})</option>`).join('')}
            </select>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-task">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Tarea</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderTaskList() {
    const statusFilter = container.querySelector('#filter-status').value;
    const catFilter = container.querySelector('#filter-category').value;
    const prioFilter = container.querySelector('#filter-priority').value;
    const sortBy = container.querySelector('#sort-by').value;

    let filtered = [...tasks];
    if (statusFilter !== 'TODOS') filtered = filtered.filter(t => t.status === statusFilter);
    if (catFilter !== 'TODAS') filtered = filtered.filter(t => t.category === catFilter);
    if (prioFilter !== 'TODAS') filtered = filtered.filter(t => t.priority === prioFilter);

    if (sortBy === 'PRIORIDAD') {
      const pOrder = { 'URGENTE': 1, 'ALTA': 2, 'MEDIA': 3, 'BAJA': 4 };
      filtered.sort((a, b) => pOrder[a.priority] - pOrder[b.priority]);
    } else if (sortBy === 'DURACION') {
      filtered.sort((a, b) => (a.estimated_minutes || 0) - (b.estimated_minutes || 0));
    }

    const listEl = container.querySelector('#tasks-list-container');
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">✅</div>
          <h3>Sin tareas registradas</h3>
          <p>Crea tu primera tarea para organizar tu jornada.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'COMPLETADO';
      const goal = goals.find(g => g.id === t.goal_id);

      return `
        <div class="card" style="opacity: ${isCompleted ? '0.65' : '1'};">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; flex: 1;">
              <input type="checkbox" class="task-check" data-id="${t.id}" ${isCompleted ? 'checked' : ''} style="margin-top: 0.25rem; width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <h3 style="font-size: 1rem; ${isCompleted ? 'text-decoration: line-through;' : ''}">${escapeHtml(t.title)}</h3>
                ${t.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(t.description)}</p>` : ''}
              </div>
            </div>
            <span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority}</span>
          </div>

          <div style="margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <span>📁 ${t.category}</span>
              <span>⏱️ ${t.estimated_minutes || 30}m</span>
              ${goal ? `<span>🎯 ${escapeHtml(goal.title)}</span>` : ''}
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm btn-edit-task" data-id="${t.id}">✏️</button>
              <button class="btn btn-danger btn-sm btn-delete-task" data-id="${t.id}">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.task-check').forEach(chk => {
      chk.addEventListener('change', (e) => toggleTaskStatus(e.target.dataset.id, e.target.checked));
    });
    listEl.querySelectorAll('.btn-edit-task').forEach(btn => btn.addEventListener('click', (e) => openEditTaskModal(e.target.dataset.id)));
    listEl.querySelectorAll('.btn-delete-task').forEach(btn => btn.addEventListener('click', (e) => deleteTask(e.target.dataset.id)));
  }

  ['filter-status', 'filter-category', 'filter-priority', 'sort-by'].forEach(id => {
    container.querySelector(`#${id}`).addEventListener('change', renderTaskList);
  });

  const modal = container.querySelector('#task-modal');
  const openModalBtn = container.querySelector('#btn-open-task-modal');
  const closeModalBtn = container.querySelector('#btn-close-task-modal');
  const cancelModalBtn = container.querySelector('#btn-cancel-task');
  const form = container.querySelector('#task-form');

  function showModal(isEdit = false) {
    container.querySelector('#task-modal-title').textContent = isEdit ? 'Editar Tarea' : 'Nueva Tarea';
    modal.classList.add('active');
  }

  function hideModal() {
    modal.classList.remove('active');
    form.reset();
    container.querySelector('#task-id').value = '';
  }

  openModalBtn.addEventListener('click', () => showModal(false));
  closeModalBtn.addEventListener('click', hideModal);
  cancelModalBtn.addEventListener('click', hideModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = container.querySelector('#task-id').value;
    const taskData = {
      title: container.querySelector('#task-title').value.trim(),
      description: container.querySelector('#task-description').value.trim(),
      category: container.querySelector('#task-category').value,
      priority: container.querySelector('#task-priority').value,
      estimated_minutes: parseInt(container.querySelector('#task-minutes').value) || 30,
      due_date: container.querySelector('#task-due-date').value || null,
      goal_id: container.querySelector('#task-goal').value || null,
      user_id: user?.id
    };

    try {
      if (id) {
        if (supabaseClient && user) await supabaseClient.from('tasks').update(taskData).eq('id', id);
        else localDb.update('tasks', id, taskData);
        showToast('Tarea actualizada exitosamente', 'success');
      } else {
        taskData.status = 'PENDIENTE';
        if (supabaseClient && user) await supabaseClient.from('tasks').insert([taskData]);
        else localDb.insert('tasks', taskData);
        showToast('Nueva tarea creada', 'success');
      }
      hideModal();
      renderTasks(container);
    } catch (err) {
      showToast(err.message || 'Error al guardar la tarea', 'error');
    }
  });

  async function toggleTaskStatus(id, isCompleted) {
    const status = isCompleted ? 'COMPLETADO' : 'PENDIENTE';
    if (supabaseClient && user) await supabaseClient.from('tasks').update({ status }).eq('id', id);
    else localDb.update('tasks', id, { status });
    showToast(isCompleted ? '¡Tarea completada! 🎉' : 'Tarea marcada como pendiente', 'success');
    renderTasks(container);
  }

  function openEditTaskModal(id) {
    const t = tasks.find(item => item.id === id);
    if (!t) return;
    container.querySelector('#task-id').value = t.id;
    container.querySelector('#task-title').value = t.title;
    container.querySelector('#task-description').value = t.description || '';
    container.querySelector('#task-category').value = t.category;
    container.querySelector('#task-priority').value = t.priority;
    container.querySelector('#task-minutes').value = t.estimated_minutes || 30;
    container.querySelector('#task-due-date').value = t.due_date ? t.due_date.split('T')[0] : '';
    container.querySelector('#task-goal').value = t.goal_id || '';
    showModal(true);
  }

  function deleteTask(id) {
    confirmAction('Eliminar Tarea', '¿Estás seguro de eliminar esta tarea?', async () => {
      if (supabaseClient && user) await supabaseClient.from('tasks').delete().eq('id', id);
      else localDb.delete('tasks', id);
      showToast('Tarea eliminada', 'info');
      renderTasks(container);
    });
  }

  renderTaskList();
}

// --------------------------------------------------------------------------
// 7. GOALS MODULE
// --------------------------------------------------------------------------
async function renderGoals(container) {
  const user = getCurrentUser();
  let goals = [];
  let tasks = [];

  if (supabaseClient && user) {
    const { data: gData } = await supabaseClient.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: tData } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id);
    goals = gData || [];
    tasks = tData || [];
  } else {
    goals = localDb.get('goals');
    tasks = localDb.get('tasks');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🎯 Jerarquía de Objetivos</h1>
        <p>Define tus metas a largo plazo y desglósalas en acciones alcanzables.</p>
      </div>
      <button id="btn-open-goal-modal" class="btn btn-primary">+ Nuevo Objetivo</button>
    </div>

    <div class="grid-3" id="goals-list-container"></div>

    <div id="goal-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="goal-modal-title">Nuevo Objetivo</h3>
          <button class="btn-close-modal" id="btn-close-goal-modal">&times;</button>
        </div>
        <form id="goal-form">
          <input type="hidden" id="goal-id" />
          <div class="form-group">
            <label class="form-label">Título del Objetivo *</label>
            <input type="text" id="goal-title" class="form-control" placeholder="Ej: Dominar PostgreSQL, Correr 10k..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="goal-description" class="form-control" placeholder="¿Por qué es importante este objetivo?"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nivel Jerárquico</label>
              <select id="goal-level" class="form-control">
                ${GOAL_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select id="goal-category" class="form-control">
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha Objetivo</label>
              <input type="date" id="goal-target-date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Progreso (%)</label>
              <input type="number" id="goal-progress" class="form-control" min="0" max="100" value="0" />
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-goal">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Objetivo</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderGoalsList() {
    const listEl = container.querySelector('#goals-list-container');
    if (goals.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🎯</div>
          <h3>Sin Objetivos Creados</h3>
          <p>Comienza definiendo metas claras para potenciar tu productividad.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = goals.map(g => {
      const boundTasks = tasks.filter(t => t.goal_id === g.id);
      const completedTasks = boundTasks.filter(t => t.status === 'COMPLETADO');
      let calculatedProgress = boundTasks.length > 0 ? Math.round((completedTasks.length / boundTasks.length) * 100) : g.progress || 0;
      const levelColor = g.level === 'GRANDE' ? 'var(--accent-purple)' : g.level === 'MENSUAL' ? 'var(--accent-primary)' : 'var(--accent-success)';

      return `
        <div class="card" style="border-top: 4px solid ${levelColor};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="badge" style="background: rgba(255,255,255,0.08); color: ${levelColor};">${g.level}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${g.category || 'Personal'}</span>
          </div>
          <h3 style="font-size: 1.1rem; margin: 0.75rem 0 0.3rem 0;">${escapeHtml(g.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); min-height: 40px;">${escapeHtml(g.description || '')}</p>
          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
              <span>Avance</span>
              <strong style="color: ${levelColor};">${calculatedProgress}%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${calculatedProgress}%; height: 100%; background: ${levelColor};"></div>
            </div>
          </div>
          <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-dim); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <span>📋 Tareas: ${completedTasks.length}/${boundTasks.length}</span>
            <div style="display: flex; gap: 0.3rem;">
              <button class="btn btn-secondary btn-sm btn-edit-goal" data-id="${g.id}">✏️</button>
              <button class="btn btn-danger btn-sm btn-delete-goal" data-id="${g.id}">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-edit-goal').forEach(btn => btn.addEventListener('click', (e) => openEditGoalModal(e.target.dataset.id)));
    listEl.querySelectorAll('.btn-delete-goal').forEach(btn => btn.addEventListener('click', (e) => deleteGoal(e.target.dataset.id)));
  }

  const modal = container.querySelector('#goal-modal');
  const openBtn = container.querySelector('#btn-open-goal-modal');
  const closeBtn = container.querySelector('#btn-close-goal-modal');
  const cancelBtn = container.querySelector('#btn-cancel-goal');
  const form = container.querySelector('#goal-form');

  function showModal(isEdit = false) {
    container.querySelector('#goal-modal-title').textContent = isEdit ? 'Editar Objetivo' : 'Nuevo Objetivo';
    modal.classList.add('active');
  }

  function hideModal() {
    modal.classList.remove('active');
    form.reset();
    container.querySelector('#goal-id').value = '';
  }

  openBtn.addEventListener('click', () => showModal(false));
  closeBtn.addEventListener('click', hideModal);
  cancelBtn.addEventListener('click', hideModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = container.querySelector('#goal-id').value;
    const goalData = {
      title: container.querySelector('#goal-title').value.trim(),
      description: container.querySelector('#goal-description').value.trim(),
      level: container.querySelector('#goal-level').value,
      category: container.querySelector('#goal-category').value,
      target_date: container.querySelector('#goal-target-date').value || null,
      progress: parseInt(container.querySelector('#goal-progress').value) || 0,
      user_id: user?.id
    };

    if (id) {
      if (supabaseClient && user) await supabaseClient.from('goals').update(goalData).eq('id', id);
      else localDb.update('goals', id, goalData);
      showToast('Objetivo actualizado', 'success');
    } else {
      if (supabaseClient && user) await supabaseClient.from('goals').insert([goalData]);
      else localDb.insert('goals', goalData);
      showToast('Nuevo objetivo registrado', 'success');
    }
    hideModal();
    renderGoals(container);
  });

  function openEditGoalModal(id) {
    const g = goals.find(item => item.id === id);
    if (!g) return;
    container.querySelector('#goal-id').value = g.id;
    container.querySelector('#goal-title').value = g.title;
    container.querySelector('#goal-description').value = g.description || '';
    container.querySelector('#goal-level').value = g.level;
    container.querySelector('#goal-category').value = g.category;
    container.querySelector('#goal-target-date').value = g.target_date ? g.target_date.split('T')[0] : '';
    container.querySelector('#goal-progress').value = g.progress || 0;
    showModal(true);
  }

  function deleteGoal(id) {
    confirmAction('Eliminar Objetivo', '¿Eliminar este objetivo?', async () => {
      if (supabaseClient && user) await supabaseClient.from('goals').delete().eq('id', id);
      else localDb.delete('goals', id);
      showToast('Objetivo eliminado', 'info');
      renderGoals(container);
    });
  }

  renderGoalsList();
}

// --------------------------------------------------------------------------
// 8. HABITS MODULE
// --------------------------------------------------------------------------
async function renderHabits(container) {
  const user = getCurrentUser();
  let habits = [];
  let habitLogs = [];

  if (supabaseClient && user) {
    const { data: hData } = await supabaseClient.from('habits').select('*').eq('user_id', user.id);
    const { data: lData } = await supabaseClient.from('habit_logs').select('*').eq('user_id', user.id);
    habits = hData || [];
    habitLogs = lData || [];
  } else {
    habits = localDb.get('habits');
    habitLogs = localDb.get('habit_logs');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🧠 Registro de Hábitos</h1>
        <p>Construye disciplina diaria y monitorea tus rachas de consistencia.</p>
      </div>
      <button id="btn-open-habit-modal" class="btn btn-primary">+ Nuevo Hábito</button>
    </div>

    <div class="grid-2" id="habits-list-container"></div>

    <div id="habit-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Hábito</h3>
          <button class="btn-close-modal" id="btn-close-habit-modal">&times;</button>
        </div>
        <form id="habit-form">
          <div class="form-group">
            <label class="form-label">Nombre del Hábito *</label>
            <input type="text" id="habit-name" class="form-control" placeholder="Ej: Meditar, Leer 20 páginas..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Frecuencia</label>
            <select id="habit-frequency" class="form-control">
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="DIAS_LABORABLES">Días Laborables</option>
            </select>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-habit">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Hábito</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderHabitsList() {
    const listEl = container.querySelector('#habits-list-container');
    if (habits.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🧠</div>
          <h3>Sin Hábitos Registrados</h3>
          <p>Crea tu primer hábito para comenzar a hacer seguimiento diario.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = habits.map(h => {
      const isCompletedToday = habitLogs.some(l => l.habit_id === h.id && l.date === todayStr && l.completed);
      const streak = calculateStreak(h.id, habitLogs);

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${escapeHtml(h.name)}</h3>
              <span class="badge badge-medium">${h.frequency}</span>
            </div>
            <button class="btn ${isCompletedToday ? 'btn-primary' : 'btn-secondary'} btn-toggle-habit" data-id="${h.id}" data-completed="${isCompletedToday}">
              ${isCompletedToday ? '✅ Completado Hoy' : '⏳ Marcar Hoy'}
            </button>
          </div>
          <div class="grid-3" style="margin-top: 1.25rem; background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-md); text-align: center;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-warning);">🔥 ${streak}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">Racha Actual</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">85%</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">Semanal</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-success);">90%</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">Mensual</div>
            </div>
          </div>
          <div style="margin-top: 0.75rem; text-align: right;">
            <button class="btn btn-danger btn-sm btn-delete-habit" data-id="${h.id}">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-toggle-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const currentCompleted = e.currentTarget.dataset.completed === 'true';
        toggleHabitToday(id, !currentCompleted);
      });
    });

    listEl.querySelectorAll('.btn-delete-habit').forEach(btn => {
      btn.addEventListener('click', (e) => deleteHabit(e.currentTarget.dataset.id));
    });
  }

  async function toggleHabitToday(habitId, completed) {
    if (supabaseClient && user) {
      if (completed) {
        await supabaseClient.from('habit_logs').upsert([{ habit_id: habitId, user_id: user.id, date: todayStr, completed: true }]);
      } else {
        await supabaseClient.from('habit_logs').delete().eq('habit_id', habitId).eq('date', todayStr);
      }
    } else {
      let logs = localDb.get('habit_logs');
      if (completed) logs.unshift({ id: 'hl_' + Date.now(), habit_id: habitId, user_id: user?.id, date: todayStr, completed: true });
      else logs = logs.filter(l => !(l.habit_id === habitId && l.date === todayStr));
      localDb.set('habit_logs', logs);
    }
    showToast(completed ? '¡Hábito marcado para hoy! 🔥' : 'Hábito desmarcado', 'success');
    renderHabits(container);
  }

  const modal = container.querySelector('#habit-modal');
  container.querySelector('#btn-open-habit-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-habit-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-habit').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#habit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const habitData = {
      name: container.querySelector('#habit-name').value.trim(),
      frequency: container.querySelector('#habit-frequency').value,
      active: true,
      user_id: user?.id
    };

    if (supabaseClient && user) await supabaseClient.from('habits').insert([habitData]);
    else localDb.insert('habits', habitData);
    showToast('Hábito creado', 'success');
    modal.classList.remove('active');
    renderHabits(container);
  });

  function deleteHabit(id) {
    confirmAction('Eliminar Hábito', '¿Eliminar este hábito?', async () => {
      if (supabaseClient && user) await supabaseClient.from('habits').delete().eq('id', id);
      else localDb.delete('habits', id);
      showToast('Hábito eliminado', 'info');
      renderHabits(container);
    });
  }

  renderHabitsList();
}

function calculateStreak(habitId, logs) {
  const hLogs = new Set(logs.filter(l => l.habit_id === habitId && l.completed).map(l => l.date));
  let streak = 0;
  let curr = new Date();

  while (true) {
    const dStr = curr.toISOString().split('T')[0];
    if (hLogs.has(dStr)) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      if (streak === 0 && dStr === new Date().toISOString().split('T')[0]) {
        curr.setDate(curr.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

// --------------------------------------------------------------------------
// 9. FOCUS MODE (POMODORO)
// --------------------------------------------------------------------------
let focusTimerInterval = null;
let focusTimeRemaining = 25 * 60;
let focusTotalDuration = 25;
let focusIsRunning = false;

async function renderFocus(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>⚡ Modo Enfoque Pomodoro</h1>
        <p>Bloques de trabajo hiper-enfocados sin distracciones.</p>
      </div>
    </div>

    <div class="card" style="max-width: 650px; margin: 0 auto; text-align: center; padding: 2.5rem 1.5rem;">
      <div style="display: flex; justify-content: center; gap: 0.75rem; margin-bottom: 2rem;">
        <button class="btn btn-timer-preset ${focusTotalDuration === 25 ? 'btn-primary' : 'btn-secondary'}" data-mins="25">25 Minutos</button>
        <button class="btn btn-timer-preset ${focusTotalDuration === 50 ? 'btn-primary' : 'btn-secondary'}" data-mins="50">50 Minutos</button>
        <button class="btn btn-timer-preset ${focusTotalDuration === 90 ? 'btn-primary' : 'btn-secondary'}" data-mins="90">90 Minutos</button>
      </div>

      <div id="timer-display" style="font-family: var(--font-heading); font-size: 5rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 2rem;">
        ${formatTime(focusTimeRemaining)}
      </div>

      <div style="display: flex; justify-content: center; gap: 1rem;">
        <button id="btn-timer-toggle" class="btn btn-primary" style="padding: 0.8rem 2.5rem; font-size: 1.1rem;">
          ${focusIsRunning ? '⏸️ Pausar' : '▶️ Iniciar Enfoque'}
        </button>
        <button id="btn-timer-reset" class="btn btn-secondary" style="padding: 0.8rem 1.5rem;">🔄 Reiniciar</button>
      </div>
    </div>
  `;

  const displayEl = container.querySelector('#timer-display');
  const toggleBtn = container.querySelector('#btn-timer-toggle');
  const resetBtn = container.querySelector('#btn-timer-reset');

  container.querySelectorAll('.btn-timer-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (focusIsRunning) return;
      container.querySelectorAll('.btn-timer-preset').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      e.currentTarget.classList.add('btn-primary');
      e.currentTarget.classList.remove('btn-secondary');

      focusTotalDuration = parseInt(e.currentTarget.dataset.mins);
      focusTimeRemaining = focusTotalDuration * 60;
      displayEl.textContent = formatTime(focusTimeRemaining);
    });
  });

  toggleBtn.addEventListener('click', () => {
    if (focusIsRunning) {
      clearInterval(focusTimerInterval);
      focusIsRunning = false;
      toggleBtn.textContent = '▶️ Reanudar';
    } else {
      focusIsRunning = true;
      toggleBtn.textContent = '⏸️ Pausar';
      focusTimerInterval = setInterval(() => {
        focusTimeRemaining--;
        displayEl.textContent = formatTime(focusTimeRemaining);
        if (focusTimeRemaining <= 0) {
          clearInterval(focusTimerInterval);
          focusIsRunning = false;
          showToast(`¡Sesión de ${focusTotalDuration} min completada! 🎉`, 'success');
          focusTimeRemaining = focusTotalDuration * 60;
          displayEl.textContent = formatTime(focusTimeRemaining);
          toggleBtn.textContent = '▶️ Iniciar Enfoque';
        }
      }, 1000);
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(focusTimerInterval);
    focusIsRunning = false;
    focusTimeRemaining = focusTotalDuration * 60;
    displayEl.textContent = formatTime(focusTimeRemaining);
    toggleBtn.textContent = '▶️ Iniciar Enfoque';
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --------------------------------------------------------------------------
// 10. STUDY MODULE
// --------------------------------------------------------------------------
async function renderStudy(container) {
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

    <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, rgba(30, 40, 62, 0.8), rgba(24, 32, 50, 0.9)); border-left: 4px solid var(--accent-primary);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase;">⏱️ Horas de Estudio Invertidas</div>
          <div style="font-size: 2.2rem; font-weight: 700; color: var(--text-main); margin-top: 0.2rem;">${totalHours} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;">Horas Totales</span></div>
        </div>
        <div style="font-size: 2.5rem; opacity: 0.8;">🎓</div>
      </div>
    </div>

    <div class="grid-2" id="courses-list-container"></div>

    <div id="course-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Curso de Estudio</h3>
          <button class="btn-close-modal" id="btn-close-course-modal">&times;</button>
        </div>
        <form id="course-form">
          <div class="form-group">
            <label class="form-label">Nombre del Curso *</label>
            <input type="text" id="course-name" class="form-control" placeholder="Ej: Bases de Datos PostgreSQL..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="course-description" class="form-control" placeholder="Temas clave a dominar..."></textarea>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-course">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Curso</button>
          </div>
        </form>
      </div>
    </div>

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
          <p>Agrega un curso para desglosar sus temas y registrar tus sesiones.</p>
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
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: 99px; overflow: hidden;">
              <div style="width: ${progress}%; height: 100%; background: var(--accent-primary);"></div>
            </div>
          </div>

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

            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <input type="text" class="form-control input-new-topic" data-course-id="${c.id}" placeholder="+ Agregar tema..." style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" />
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

    listEl.querySelectorAll('.topic-check').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const completed = e.target.checked;
        if (supabaseClient && user) await supabaseClient.from('study_topics').update({ completed }).eq('id', id);
        else localDb.update('study_topics', id, { completed });
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
        if (supabaseClient && user) await supabaseClient.from('study_topics').insert([topicData]);
        else localDb.insert('study_topics', topicData);
        showToast('Tema agregado', 'success');
        renderStudy(container);
      });
    });

    listEl.querySelectorAll('.btn-delete-course').forEach(btn => {
      btn.addEventListener('click', (e) => deleteCourse(e.currentTarget.dataset.id));
    });
  }

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
    if (supabaseClient && user) await supabaseClient.from('study_courses').insert([data]);
    else localDb.insert('study_courses', data);
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
    if (supabaseClient && user) await supabaseClient.from('study_sessions').insert([data]);
    else localDb.insert('study_sessions', data);
    showToast('Sesión de estudio guardada', 'success');
    sModal.classList.remove('active');
    renderStudy(container);
  });

  function deleteCourse(id) {
    confirmAction('Eliminar Curso', '¿Eliminar este curso?', async () => {
      if (supabaseClient && user) await supabaseClient.from('study_courses').delete().eq('id', id);
      else localDb.delete('study_courses', id);
      showToast('Curso eliminado', 'info');
      renderStudy(container);
    });
  }

  renderCoursesList();
}

// --------------------------------------------------------------------------
// 11. GYM MODULE
// --------------------------------------------------------------------------
async function renderGym(container) {
  const user = getCurrentUser();
  let workouts = [];
  let exercises = [];

  if (supabaseClient && user) {
    const { data: wData } = await supabaseClient.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: false });
    const { data: eData } = await supabaseClient.from('workout_exercises').select('*');
    workouts = wData || [];
    exercises = eData || [];
  } else {
    workouts = localDb.get('workouts');
    exercises = localDb.get('workout_exercises');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🏋️ Registro de Gimnasio</h1>
        <p>Planifica tus sesiones de fuerza, registra pesos y evalúa tus récords personales.</p>
      </div>
      <button id="btn-open-workout-modal" class="btn btn-primary">+ Nuevo Entrenamiento</button>
    </div>

    <div class="grid-2" id="workouts-list-container"></div>

    <div id="workout-modal" class="modal-overlay">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>Nuevo Entrenamiento</h3>
          <button class="btn-close-modal" id="btn-close-workout-modal">&times;</button>
        </div>
        <form id="workout-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre del Entrenamiento *</label>
              <input type="text" id="workout-name" class="form-control" placeholder="Ej: Pecho y Tríceps..." required />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" id="workout-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
          </div>

          <div style="margin-top: 1rem;">
            <label class="form-label">Ejercicios de la Sesión</label>
            <div id="exercises-inputs-container">
              <div class="form-row exercise-row" style="margin-bottom: 0.5rem;">
                <input type="text" class="form-control ex-name" placeholder="Ejercicio" required />
                <input type="number" class="form-control ex-sets" placeholder="Series" value="4" style="width: 75px;" required />
                <input type="number" class="form-control ex-reps" placeholder="Reps" value="10" style="width: 75px;" required />
                <input type="number" class="form-control ex-weight" placeholder="Kg" value="60" step="0.5" style="width: 85px;" required />
              </div>
            </div>
            <button type="button" id="btn-add-exercise-row" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;">+ Agregar Otro Ejercicio</button>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-workout">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Entrenamiento</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderWorkoutsList() {
    const listEl = container.querySelector('#workouts-list-container');
    if (workouts.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🏋️</div>
          <h3>Sin Entrenamientos Registrados</h3>
          <p>Registra tu primera rutina de gym con tus series y kilajes.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = workouts.map(w => {
      const wExs = exercises.filter(e => e.workout_id === w.id);

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(w.name)}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">📅 ${w.date}</div>
            </div>
            <button class="btn btn-danger btn-sm btn-delete-workout" data-id="${w.id}">🗑️</button>
          </div>

          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
              <thead>
                <tr style="color: var(--text-dim); text-align: left; border-bottom: 1px solid var(--border-color);">
                  <th style="padding-bottom: 0.4rem;">Ejercicio</th>
                  <th style="padding-bottom: 0.4rem; text-align: center;">Series</th>
                  <th style="padding-bottom: 0.4rem; text-align: center;">Reps</th>
                  <th style="padding-bottom: 0.4rem; text-align: right;">Peso</th>
                </tr>
              </thead>
              <tbody>
                ${wExs.map(e => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <td style="padding: 0.4rem 0; font-weight: 600;">${escapeHtml(e.exercise)}</td>
                    <td style="text-align: center;">${e.sets}</td>
                    <td style="text-align: center;">${e.reps}</td>
                    <td style="text-align: right; color: var(--accent-warning); font-weight: 700;">${e.weight || 0} kg</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-delete-workout').forEach(btn => {
      btn.addEventListener('click', (e) => deleteWorkout(e.currentTarget.dataset.id));
    });
  }

  const exContainer = container.querySelector('#exercises-inputs-container');
  container.querySelector('#btn-add-exercise-row').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'form-row exercise-row';
    row.style.marginBottom = '0.5rem';
    row.innerHTML = `
      <input type="text" class="form-control ex-name" placeholder="Ejercicio" required />
      <input type="number" class="form-control ex-sets" placeholder="Series" value="4" style="width: 75px;" required />
      <input type="number" class="form-control ex-reps" placeholder="Reps" value="10" style="width: 75px;" required />
      <input type="number" class="form-control ex-weight" placeholder="Kg" value="60" step="0.5" style="width: 85px;" required />
    `;
    exContainer.appendChild(row);
  });

  const modal = container.querySelector('#workout-modal');
  container.querySelector('#btn-open-workout-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-workout-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-workout').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#workout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const wName = container.querySelector('#workout-name').value.trim();
    const wDate = container.querySelector('#workout-date').value;

    const rows = container.querySelectorAll('.exercise-row');
    const exsData = Array.from(rows).map(r => ({
      exercise: r.querySelector('.ex-name').value.trim(),
      sets: parseInt(r.querySelector('.ex-sets').value) || 1,
      reps: parseInt(r.querySelector('.ex-reps').value) || 1,
      weight: parseFloat(r.querySelector('.ex-weight').value) || 0
    }));

    if (supabaseClient && user) {
      const { data: wRes, error } = await supabaseClient.from('workouts').insert([{ name: wName, date: wDate, user_id: user.id }]).select();
      if (!error && wRes[0]) {
        const wId = wRes[0].id;
        const mappedExs = exsData.map(e => ({ ...e, workout_id: wId }));
        await supabaseClient.from('workout_exercises').insert(mappedExs);
      }
    } else {
      const wObj = localDb.insert('workouts', { name: wName, date: wDate, user_id: user?.id });
      exsData.forEach(e => localDb.insert('workout_exercises', { ...e, workout_id: wObj.id }));
    }

    showToast('Entrenamiento guardado', 'success');
    modal.classList.remove('active');
    renderGym(container);
  });

  function deleteWorkout(id) {
    confirmAction('Eliminar Entrenamiento', '¿Eliminar este entrenamiento?', async () => {
      if (supabaseClient && user) await supabaseClient.from('workouts').delete().eq('id', id);
      else localDb.delete('workouts', id);
      showToast('Entrenamiento eliminado', 'info');
      renderGym(container);
    });
  }

  renderWorkoutsList();
}

// --------------------------------------------------------------------------
// 12. SPORTS SESSIONS MODULE
// --------------------------------------------------------------------------
async function renderSports(container) {
  const user = getCurrentUser();
  let sessions = [];

  if (supabaseClient && user) {
    const { data } = await supabaseClient.from('sports_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    sessions = data || [];
  } else {
    sessions = localDb.get('sports_sessions');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>⚽ Actividad Deportiva</h1>
        <p>Registra tus partidos, carreras, natación y entrenamientos de cardio.</p>
      </div>
      <button id="btn-open-sport-modal" class="btn btn-primary">+ Nueva Sesión</button>
    </div>

    <div class="grid-3" id="sports-list-container"></div>

    <div id="sport-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Registrar Actividad Deportiva</h3>
          <button class="btn-close-modal" id="btn-close-sport-modal">&times;</button>
        </div>
        <form id="sport-form">
          <div class="form-group">
            <label class="form-label">Deporte / Actividad *</label>
            <input type="text" id="sport-name" class="form-control" placeholder="Ej: Fútbol 7, Running 5k, Natación..." required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duración (minutos)</label>
              <input type="number" id="sport-duration" class="form-control" value="60" min="10" step="5" required />
            </div>
            <div class="form-group">
              <label class="form-label">Intensidad</label>
              <select id="sport-intensity" class="form-control">
                <option value="SUAVE">Suave</option>
                <option value="MODERADA" selected>Moderada</option>
                <option value="ALTA">Alta</option>
                <option value="EXTREMA">Extrema</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="sport-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Notas / Sensaciones</label>
            <textarea id="sport-notes" class="form-control" placeholder="Marcador, distancia, estado físico..."></textarea>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-sport">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Sesión</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderSportsList() {
    const listEl = container.querySelector('#sports-list-container');
    if (sessions.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⚽</div>
          <h3>Sin Sesiones Deportivas</h3>
          <p>Registra tus actividades de cardio o deportes.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = sessions.map(s => {
      const intClass = s.intensity === 'EXTREMA' ? 'badge-urgent' : s.intensity === 'ALTA' ? 'badge-high' : 'badge-medium';

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(s.sport)}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">📅 ${s.date}</div>
            </div>
            <span class="badge ${intClass}">${s.intensity}</span>
          </div>
          <div style="margin-top: 1rem; font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">
            ⏱️ ${s.duration_minutes} min
          </div>
          ${s.notes ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">${escapeHtml(s.notes)}</p>` : ''}
          <div style="margin-top: 1rem; text-align: right; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button class="btn btn-danger btn-sm btn-delete-sport" data-id="${s.id}">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-delete-sport').forEach(btn => btn.addEventListener('click', (e) => deleteSport(e.currentTarget.dataset.id)));
  }

  const modal = container.querySelector('#sport-modal');
  container.querySelector('#btn-open-sport-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-sport-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-sport').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#sport-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      sport: container.querySelector('#sport-name').value.trim(),
      duration_minutes: parseInt(container.querySelector('#sport-duration').value),
      intensity: container.querySelector('#sport-intensity').value,
      date: container.querySelector('#sport-date').value,
      notes: container.querySelector('#sport-notes').value.trim(),
      user_id: user?.id
    };

    if (supabaseClient && user) await supabaseClient.from('sports_sessions').insert([data]);
    else localDb.insert('sports_sessions', data);
    showToast('Sesión deportiva registrada', 'success');
    modal.classList.remove('active');
    renderSports(container);
  });

  function deleteSport(id) {
    confirmAction('Eliminar Sesión', '¿Eliminar esta sesión deportiva?', async () => {
      if (supabaseClient && user) await supabaseClient.from('sports_sessions').delete().eq('id', id);
      else localDb.delete('sports_sessions', id);
      showToast('Sesión eliminada', 'info');
      renderSports(container);
    });
  }

  renderSportsList();
}

// --------------------------------------------------------------------------
// 13. PROJECTS MODULE
// --------------------------------------------------------------------------
async function renderProjects(container) {
  const user = getCurrentUser();
  let projects = [];
  let pTasks = [];

  if (supabaseClient && user) {
    const { data: prData } = await supabaseClient.from('projects').select('*').eq('user_id', user.id);
    const { data: ptData } = await supabaseClient.from('project_tasks').select('*');
    projects = prData || [];
    pTasks = ptData || [];
  } else {
    projects = localDb.get('projects');
    pTasks = localDb.get('project_tasks');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>💻 Proyectos Personales</h1>
        <p>Gestiona desarrollos y entregables por fases de ciclo de vida.</p>
      </div>
      <button id="btn-open-project-modal" class="btn btn-primary">+ Nuevo Proyecto</button>
    </div>

    <div class="grid-2" id="projects-list-container"></div>

    <div id="project-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Proyecto</h3>
          <button class="btn-close-modal" id="btn-close-project-modal">&times;</button>
        </div>
        <form id="project-form">
          <div class="form-group">
            <label class="form-label">Nombre del Proyecto *</label>
            <input type="text" id="project-name" class="form-control" placeholder="Ej: App Finanzas..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="project-description" class="form-control" placeholder="Alcance del proyecto..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fase Actual</label>
              <select id="project-status" class="form-control">
                <option value="IDEA">Idea</option>
                <option value="PLANIFICACIÓN">Planificación</option>
                <option value="DESARROLLO" selected>Desarrollo</option>
                <option value="PRUEBAS">Pruebas</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad</label>
              <select id="project-priority" class="form-control">
                <option value="BAJA">Baja</option>
                <option value="MEDIA" selected>Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-project">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Proyecto</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderProjectsList() {
    const listEl = container.querySelector('#projects-list-container');
    if (projects.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">💻</div>
          <h3>Sin Proyectos Activos</h3>
          <p>Crea tu primer proyecto técnico.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = projects.map(p => {
      const boundTasks = pTasks.filter(t => t.project_id === p.id);
      const completedCount = boundTasks.filter(t => t.status === 'COMPLETADO').length;
      const progress = boundTasks.length > 0 ? Math.round((completedCount / boundTasks.length) * 100) : p.progress || 0;

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(p.name)}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(p.description || '')}</p>
            </div>
            <span class="badge badge-medium">${p.status}</span>
          </div>

          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
              <span>Avance General</span>
              <strong>${progress}%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: 99px; overflow: hidden;">
              <div style="width: ${progress}%; height: 100%; background: var(--accent-purple);"></div>
            </div>
          </div>

          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">⚙️ Hitos / Tareas Técnicas</div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 140px; overflow-y: auto;">
              ${boundTasks.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; background: var(--bg-secondary); padding: 0.4rem 0.65rem; border-radius: var(--radius-sm);">
                  <span>${escapeHtml(t.title)}</span>
                  <select class="form-control select-ptask-status" data-id="${t.id}" style="width: 120px; padding: 0.2rem 0.4rem; font-size: 0.75rem;">
                    <option value="IDEA" ${t.status === 'IDEA' ? 'selected' : ''}>Idea</option>
                    <option value="PLANIFICACIÓN" ${t.status === 'PLANIFICACIÓN' ? 'selected' : ''}>Planif</option>
                    <option value="DESARROLLO" ${t.status === 'DESARROLLO' ? 'selected' : ''}>Desarrollo</option>
                    <option value="PRUEBAS" ${t.status === 'PRUEBAS' ? 'selected' : ''}>Pruebas</option>
                    <option value="COMPLETADO" ${t.status === 'COMPLETADO' ? 'selected' : ''}>Listo ✅</option>
                  </select>
                </div>
              `).join('')}
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <input type="text" class="form-control input-new-ptask" data-project-id="${p.id}" placeholder="+ Nueva tarea técnica..." style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" />
              <button class="btn btn-secondary btn-sm btn-add-ptask" data-project-id="${p.id}">Añadir</button>
            </div>
          </div>

          <div style="margin-top: 0.75rem; text-align: right;">
            <button class="btn btn-danger btn-sm btn-delete-project" data-id="${p.id}">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.select-ptask-status').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        if (supabaseClient && user) await supabaseClient.from('project_tasks').update({ status }).eq('id', id);
        else localDb.update('project_tasks', id, { status });
        renderProjects(container);
      });
    });

    listEl.querySelectorAll('.btn-add-ptask').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const projectId = e.currentTarget.dataset.projectId;
        const input = container.querySelector(`.input-new-ptask[data-project-id="${projectId}"]`);
        const title = input.value.trim();
        if (!title) return;

        const data = { project_id: projectId, title, status: 'DESARROLLO' };
        if (supabaseClient && user) await supabaseClient.from('project_tasks').insert([data]);
        else localDb.insert('project_tasks', data);
        showToast('Tarea técnica añadida', 'success');
        renderProjects(container);
      });
    });

    listEl.querySelectorAll('.btn-delete-project').forEach(btn => btn.addEventListener('click', (e) => deleteProject(e.currentTarget.dataset.id)));
  }

  const modal = container.querySelector('#project-modal');
  container.querySelector('#btn-open-project-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-project-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-project').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: container.querySelector('#project-name').value.trim(),
      description: container.querySelector('#project-description').value.trim(),
      status: container.querySelector('#project-status').value,
      priority: container.querySelector('#project-priority').value,
      user_id: user?.id
    };

    if (supabaseClient && user) await supabaseClient.from('projects').insert([data]);
    else localDb.insert('projects', data);
    showToast('Proyecto creado', 'success');
    modal.classList.remove('active');
    renderProjects(container);
  });

  function deleteProject(id) {
    confirmAction('Eliminar Proyecto', '¿Eliminar este proyecto y sus tareas?', async () => {
      if (supabaseClient && user) await supabaseClient.from('projects').delete().eq('id', id);
      else localDb.delete('projects', id);
      showToast('Proyecto eliminado', 'info');
      renderProjects(container);
    });
  }

  renderProjectsList();
}

// --------------------------------------------------------------------------
// 14. STARTUP WORKSPACE MODULE
// --------------------------------------------------------------------------
async function renderStartup(container) {
  const user = getCurrentUser();
  let workspace = null;
  let members = [];
  let roadmap = [];
  let products = [];
  let tasks = [];

  if (supabaseClient && user) {
    const { data: wData } = await supabaseClient.from('startup_workspaces').select('*').limit(1);
    if (wData && wData.length > 0) workspace = wData[0];
    else {
      const { data: newW } = await supabaseClient.from('startup_workspaces').insert([{ owner_id: user.id, name: 'Mi Startup Hub', description: 'Espacio de aceleración e innovación.' }]).select();
      workspace = newW ? newW[0] : null;
    }

    if (workspace) {
      const { data: mData } = await supabaseClient.from('startup_members').select('*').eq('workspace_id', workspace.id);
      const { data: rData } = await supabaseClient.from('startup_roadmap').select('*').eq('workspace_id', workspace.id);
      const { data: pData } = await supabaseClient.from('startup_products').select('*').eq('workspace_id', workspace.id);
      const { data: tData } = await supabaseClient.from('startup_tasks').select('*').eq('workspace_id', workspace.id);
      members = mData || [];
      roadmap = rData || [];
      products = pData || [];
      tasks = tData || [];
    }
  } else {
    let wsList = localDb.get('startup_workspaces');
    if (wsList.length === 0) workspace = localDb.insert('startup_workspaces', { owner_id: user?.id, name: 'Mi Startup Hub', description: 'Espacio de aceleración.' });
    else workspace = wsList[0];
    members = localDb.get('startup_members');
    roadmap = localDb.get('startup_roadmap');
    products = localDb.get('startup_products');
    tasks = localDb.get('startup_tasks');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🚀 Startup Workspace: ${escapeHtml(workspace?.name || 'Hub')}</h1>
        <p>Aceleración de emprendimiento, roadmap, equipo y producto.</p>
      </div>
    </div>

    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; flex-wrap: wrap;">
      <button class="btn btn-primary btn-tab active" data-tab="roadmap">🗺️ Roadmap (6 Etapas)</button>
      <button class="btn btn-secondary btn-tab" data-tab="team">👥 Equipo (${members.length})</button>
      <button class="btn btn-secondary btn-tab" data-tab="product">📦 Producto (${products.length})</button>
      <button class="btn btn-secondary btn-tab" data-tab="tasks">✅ Tareas (${tasks.length})</button>
    </div>

    <div id="tab-content-roadmap" class="tab-pane active">
      <div class="card" style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">Roadmap de Aceleración de Startup</h3>
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${STARTUP_STAGES.map((stage, idx) => {
            const stageItem = roadmap.find(r => r.stage === stage);
            const isReached = stageItem?.status === 'ALCANZADO';
            const isInProgress = stageItem?.status === 'EN_PROGRESO';

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid ${isReached ? 'var(--accent-success)' : isInProgress ? 'var(--accent-warning)' : 'var(--border-color)'}; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <strong style="color: var(--text-dim); font-size: 1.1rem;">${idx + 1}.</strong>
                  <span style="font-weight: 700; font-size: 1rem;">${stage}</span>
                </div>
                <select class="form-control select-roadmap-status" data-stage="${stage}" style="width: 150px;">
                  <option value="PENDIENTE" ${!stageItem || stageItem.status === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                  <option value="EN_PROGRESO" ${stageItem?.status === 'EN_PROGRESO' ? 'selected' : ''}>En Progreso ⏳</option>
                  <option value="ALCANZADO" ${stageItem?.status === 'ALCANZADO' ? 'selected' : ''}>Alcanzado ✅</option>
                </select>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <div id="tab-content-team" class="tab-pane" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Miembros del Equipo</h3>
        <button id="btn-open-member-modal" class="btn btn-primary">+ Agregar Miembro</button>
      </div>
      <div class="grid-3" id="members-list-container"></div>
    </div>

    <div id="tab-content-product" class="tab-pane" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Backlog de Producto</h3>
        <button id="btn-open-product-modal" class="btn btn-primary">+ Nueva Feature</button>
      </div>
      <div class="grid-2" id="products-list-container"></div>
    </div>

    <div id="tab-content-tasks" class="tab-pane" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Tareas del Equipo</h3>
        <button id="btn-open-stask-modal" class="btn btn-primary">+ Asignar Tarea</button>
      </div>
      <div class="grid-2" id="stasks-list-container"></div>
    </div>

    <div id="member-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Miembro del Equipo</h3>
          <button class="btn-close-modal" id="btn-close-member-modal">&times;</button>
        </div>
        <form id="member-form">
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input type="text" id="member-name" class="form-control" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select id="member-role" class="form-control">
                <option value="FOUNDER">Founder</option>
                <option value="CEO">CEO</option>
                <option value="CTO">CTO</option>
                <option value="DEVELOPER" selected>Developer</option>
                <option value="DESIGNER">Designer</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="member-email" class="form-control" />
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-member">Cancelar</button>
            <button type="submit" class="btn btn-primary">Agregar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.btn-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active', 'btn-primary'));
      tabs.forEach(t => t.classList.add('btn-secondary'));
      e.currentTarget.classList.add('active', 'btn-primary');
      e.currentTarget.classList.remove('btn-secondary');

      container.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      const target = e.currentTarget.dataset.tab;
      container.querySelector(`#tab-content-${target}`).style.display = 'block';
    });
  });

  container.querySelectorAll('.select-roadmap-status').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const stage = e.target.dataset.stage;
      const status = e.target.value;
      if (supabaseClient && user && workspace) await supabaseClient.from('startup_roadmap').upsert([{ workspace_id: workspace.id, stage, status }]);
      else {
        let rList = localDb.get('startup_roadmap');
        const idx = rList.findIndex(r => r.stage === stage);
        if (idx !== -1) rList[idx].status = status;
        else rList.push({ id: 'rm_' + Date.now(), workspace_id: workspace.id, stage, status });
        localDb.set('startup_roadmap', rList);
      }
      showToast(`Etapa ${stage} actualizada`, 'info');
    });
  });

  function renderSubLists() {
    const mEl = container.querySelector('#members-list-container');
    mEl.innerHTML = members.length === 0 ? '<p style="color: var(--text-muted);">Sin miembros registrados.</p>' : members.map(m => `
      <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 1rem;">${escapeHtml(m.name)}</h4>
          <span class="badge badge-medium">${m.role}</span>
          ${m.email ? `<div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.2rem;">${escapeHtml(m.email)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  const mModal = container.querySelector('#member-modal');
  container.querySelector('#btn-open-member-modal')?.addEventListener('click', () => mModal.classList.add('active'));
  container.querySelector('#btn-close-member-modal')?.addEventListener('click', () => mModal.classList.remove('active'));
  container.querySelector('#btn-cancel-member')?.addEventListener('click', () => mModal.classList.remove('active'));

  container.querySelector('#member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      workspace_id: workspace.id,
      name: container.querySelector('#member-name').value.trim(),
      role: container.querySelector('#member-role').value,
      email: container.querySelector('#member-email').value.trim() || null
    };

    if (supabaseClient && user) await supabaseClient.from('startup_members').insert([data]);
    else localDb.insert('startup_members', data);
    showToast('Miembro agregado', 'success');
    mModal.classList.remove('active');
    renderStartup(container);
  });

  renderSubLists();
}

// --------------------------------------------------------------------------
// 15. STATS MODULE (DYNAMIC CHART.JS)
// --------------------------------------------------------------------------
let chartInstance1 = null;
let chartInstance2 = null;

async function renderStats(container) {
  const user = getCurrentUser();
  let studySessions = [];
  let sportsSessions = [];
  let workouts = [];
  let tasks = [];
  let habitLogs = [];

  if (supabaseClient && user) {
    const { data: st } = await supabaseClient.from('study_sessions').select('*').eq('user_id', user.id);
    const { data: sp } = await supabaseClient.from('sports_sessions').select('*').eq('user_id', user.id);
    const { data: wo } = await supabaseClient.from('workouts').select('*').eq('user_id', user.id);
    const { data: tk } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id);
    const { data: hl } = await supabaseClient.from('habit_logs').select('*').eq('user_id', user.id);
    studySessions = st || [];
    sportsSessions = sp || [];
    workouts = wo || [];
    tasks = tk || [];
    habitLogs = hl || [];
  } else {
    studySessions = localDb.get('study_sessions');
    sportsSessions = localDb.get('sports_sessions');
    workouts = localDb.get('workouts');
    tasks = localDb.get('tasks');
    habitLogs = localDb.get('habit_logs');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>📊 Estadísticas y Analítica Personal</h1>
        <p>Visualiza tu rendimiento, tiempo invertido por áreas y hábitos.</p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-primary btn-filter-period active" data-period="TODOS">Todo</button>
        <button class="btn btn-secondary btn-filter-period" data-period="MES">Este Mes</button>
        <button class="btn btn-secondary btn-filter-period" data-period="SEMANA">Esta Semana</button>
        <button class="btn btn-secondary btn-filter-period" data-period="HOY">Hoy</button>
      </div>
    </div>

    <div class="grid-4" style="margin-bottom: 2rem;">
      <div class="card" style="border-left: 4px solid var(--accent-primary);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">📚 HORAS ESTUDIO</div>
        <div id="kpi-study" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0h</div>
      </div>
      <div class="card" style="border-left: 4px solid var(--accent-warning);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">🏋️ ENTRENAMIENTOS</div>
        <div id="kpi-gym" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0</div>
      </div>
      <div class="card" style="border-left: 4px solid var(--accent-success);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">✅ TAREAS LISTAS</div>
        <div id="kpi-tasks" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0</div>
      </div>
      <div class="card" style="border-left: 4px solid var(--accent-purple);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">🧠 HÁBITOS CUMPLIDOS</div>
        <div id="kpi-habits" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">⏱️ Distribución del Tiempo (Horas)</h3>
        <div style="position: relative; height: 290px;">
          <canvas id="chart-hours-distribution"></canvas>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">🔥 Tareas vs Hábitos Completados</h3>
        <div style="position: relative; height: 290px;">
          <canvas id="chart-completion"></canvas>
        </div>
      </div>
    </div>
  `;

  function updateCharts(period = 'TODOS') {
    const studyHours = (studySessions.reduce((a, b) => a + (b.duration_minutes || 0), 0) / 60).toFixed(1);
    const sportsHours = (sportsSessions.reduce((a, b) => a + (b.duration_minutes || 0), 0) / 60).toFixed(1);
    const gymHours = (workouts.length * 1.0).toFixed(1);
    const completedTasksCount = tasks.filter(t => t.status === 'COMPLETADO').length;
    const completedHabitsCount = habitLogs.filter(h => h.completed).length;

    container.querySelector('#kpi-study').textContent = `${studyHours}h`;
    container.querySelector('#kpi-gym').textContent = workouts.length;
    container.querySelector('#kpi-tasks').textContent = completedTasksCount;
    container.querySelector('#kpi-habits').textContent = completedHabitsCount;

    if (window.Chart) {
      if (chartInstance1) chartInstance1.destroy();
      if (chartInstance2) chartInstance2.destroy();

      const ctx1 = container.querySelector('#chart-hours-distribution').getContext('2d');
      chartInstance1 = new window.Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Estudios', 'Deporte', 'Gimnasio'],
          datasets: [{
            data: [parseFloat(studyHours), parseFloat(sportsHours), parseFloat(gymHours)],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#f3f4f6' } } }
        }
      });

      const ctx2 = container.querySelector('#chart-completion').getContext('2d');
      chartInstance2 = new window.Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Tareas Completadas', 'Hábitos Registrados'],
          datasets: [{
            label: 'Total Realizado',
            data: [completedTasksCount, completedHabitsCount],
            backgroundColor: ['#10b981', '#8b5cf6'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  container.querySelectorAll('.btn-filter-period').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.btn-filter-period').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      e.currentTarget.classList.add('active', 'btn-primary');
      e.currentTarget.classList.remove('btn-secondary');
      updateCharts(e.currentTarget.dataset.period);
    });
  });

  updateCharts('TODOS');
}

// --------------------------------------------------------------------------
// 16. QUICK ACTION MODAL (+ BUTTON)
// --------------------------------------------------------------------------
function initQuickActionModal() {
  const modal = document.createElement('div');
  modal.id = 'quick-action-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 440px;">
      <div class="modal-header">
        <h3>⚡ Acción Rápida</h3>
        <button class="btn-close-modal" id="btn-close-quick-modal">&times;</button>
      </div>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">Selecciona el elemento que deseas crear instantáneamente:</p>
      
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        <button class="btn btn-secondary btn-quick-target" data-view="tasks" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">✅</span> Nueva Tarea
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="goals" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">🎯</span> Nuevo Objetivo
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="habits" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">🧠</span> Nuevo Hábito
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="study" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">📚</span> Registrar Sesión de Estudio
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="gym" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">🏋️</span> Nuevo Entrenamiento Gym
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="sports" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">⚽</span> Nueva Sesión Deportiva
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="projects" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">💻</span> Nuevo Proyecto
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#btn-close-quick-modal').addEventListener('click', () => modal.classList.remove('active'));

  modal.querySelectorAll('.btn-quick-target').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      modal.classList.remove('active');

      const navBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
      if (navBtn) navBtn.click();

      setTimeout(() => {
        const createBtn = document.querySelector('#btn-open-task-modal, #btn-open-goal-modal, #btn-open-habit-modal, #btn-open-course-modal, #btn-open-workout-modal, #btn-open-sport-modal, #btn-open-project-modal');
        createBtn?.click();
      }, 200);
    });
  });

  document.getElementById('btn-global-quick-add')?.addEventListener('click', () => {
    modal.classList.add('active');
  });
}

// --------------------------------------------------------------------------
// 17. ROUTER & SYSTEM INITIALIZATION
// --------------------------------------------------------------------------
let currentView = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
  seedLocalDemoData();
  
  initAuth((user) => {
    renderUserUI(user);
  });

  initNavigation();
  initAuthModalEvents();
  initQuickActionModal();
  initGlobalShortcutsAndSearch();
});

function renderUserUI(user) {
  const userSummary = document.getElementById('user-profile-summary');
  const authModal = document.getElementById('auth-modal');

  if (user) {
    // Si hay usuario autenticado, ocultar modal auth y renderizar perfil
    if (authModal) authModal.classList.remove('active');

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
    const initial = fullName.charAt(0).toUpperCase();

    if (userSummary) {
      userSummary.innerHTML = `
        <div class="avatar">${initial}</div>
        <div class="user-info">
          <div class="user-name">${escapeHtml(fullName)}</div>
          <div class="user-email">${escapeHtml(user.email || '')}</div>
        </div>
        <button id="btn-logout" class="btn-logout-icon" title="Cerrar Sesión">🚪</button>
      `;

      userSummary.querySelector('#btn-logout')?.addEventListener('click', () => logoutUser());
    }

    navigateTo(currentView);
  } else {
    // Si NO hay usuario autenticado, MOSTRAR SIEMPRE el modal de Login / Registro
    if (authModal) authModal.classList.add('active');
    
    if (userSummary) {
      userSummary.innerHTML = `
        <button id="btn-open-login-sidebar" class="btn btn-primary btn-sm" style="width: 100%;">🔑 Iniciar Sesión / Registro</button>
      `;
      userSummary.querySelector('#btn-open-login-sidebar')?.addEventListener('click', () => {
        authModal?.classList.add('active');
      });
    }

    // Renderizar vista previa básica o bienvenida
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="empty-state" style="margin-top: 3rem;">
          <div class="empty-state-icon">🔒</div>
          <h2>Acceso Requerido a LIFEOS</h2>
          <p>Por favor inicia sesión o crea tu cuenta para guardar en la nube con Supabase, o entra como invitado.</p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
            <button id="btn-login-hero" class="btn btn-primary">🔑 Abrir Login / Registro</button>
            <button id="btn-demo-hero" class="btn btn-secondary">🚀 Entrar como Invitado (Modo Demo)</button>
          </div>
        </div>
      `;
      contentArea.querySelector('#btn-login-hero')?.addEventListener('click', () => {
        authModal?.classList.add('active');
      });
      contentArea.querySelector('#btn-demo-hero')?.addEventListener('click', () => {
        document.getElementById('btn-demo-mode')?.click();
      });
    }
  }
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.dataset.view;
      if (!view) return;

      if (!getCurrentUser()) {
        document.getElementById('auth-modal')?.classList.add('active');
        showToast('Debes iniciar sesión para acceder a las áreas de LIFEOS', 'info');
        return;
      }

      navItems.forEach(n => n.classList.remove('active'));
      document.querySelectorAll(`[data-view="${view}"]`).forEach(n => n.classList.add('active'));

      navigateTo(view);
      document.querySelector('.sidebar')?.classList.remove('mobile-open');
    });
  });

  document.getElementById('btn-menu-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('mobile-open');
  });
}

function navigateTo(view) {
  currentView = view;
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  if (!getCurrentUser()) return;

  contentArea.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--text-muted);">Cargando LIFEOS...</div>';

  switch (view) {
    case 'dashboard': renderDashboard(contentArea); break;
    case 'goals': renderGoals(contentArea); break;
    case 'tasks': renderTasks(contentArea); break;
    case 'study': renderStudy(contentArea); break;
    case 'gym': renderGym(contentArea); break;
    case 'sports': renderSports(contentArea); break;
    case 'habits': renderHabits(contentArea); break;
    case 'focus': renderFocus(contentArea); break;
    case 'projects': renderProjects(contentArea); break;
    case 'startup': renderStartup(contentArea); break;
    case 'stats': renderStats(contentArea); break;
    default: renderDashboard(contentArea);
  }
}

function initGlobalShortcutsAndSearch() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'n')) {
      e.preventDefault();
      document.getElementById('btn-global-quick-add')?.click();
    }
  });

  const searchInput = document.querySelector('.search-input');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      document.querySelectorAll('.card').forEach(card => card.style.display = '');
      return;
    }
    document.querySelectorAll('.card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

function initAuthModalEvents() {
  const authModal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const recoverForm = document.getElementById('recover-form');

  const tabLogin = document.getElementById('tab-auth-login');
  const tabRegister = document.getElementById('tab-auth-register');
  const linkRecover = document.getElementById('link-auth-recover');
  const linkBackLogin = document.getElementById('link-back-login');

  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabLogin.classList.replace('btn-secondary', 'btn-primary');
    tabRegister.classList.remove('active');
    tabRegister.classList.replace('btn-primary', 'btn-secondary');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    recoverForm.style.display = 'none';
  });

  tabRegister?.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabRegister.classList.replace('btn-secondary', 'btn-primary');
    tabLogin.classList.remove('active');
    tabLogin.classList.replace('btn-primary', 'btn-secondary');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    recoverForm.style.display = 'none';
  });

  linkRecover?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    recoverForm.style.display = 'block';
  });

  document.getElementById('btn-demo-mode')?.addEventListener('click', () => {
    currentUser = {
      id: 'demo_user_1',
      email: 'usuario.demo@lifeos.app',
      user_metadata: { full_name: 'Usuario Demo' }
    };
    localStorage.setItem('lifeos_active_user', JSON.stringify(currentUser));
    showToast('¡Bienvenido a LIFEOS en Modo Demo! 🚀', 'success');
    authModal?.classList.remove('active');
    renderUserUI(currentUser);
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    try {
      await loginUser(email, password);
      showToast('¡Sesión iniciada con éxito! 👋', 'success');
      authModal.classList.remove('active');
      renderUserUI(currentUser);
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesión', 'error');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    try {
      await registerUser(email, password, name);
      showToast('¡Cuenta creada exitosamente! 🎉', 'success');
      authModal.classList.remove('active');
      renderUserUI(currentUser);
    } catch (err) {
      showToast(err.message || 'Error al registrarse', 'error');
    }
  });

  recoverForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recover-email').value.trim();
    try {
      await resetPassword(email);
      showToast('Correo de recuperación enviado', 'info');
      tabLogin.click();
    } catch (err) {
      showToast(err.message || 'Error al recuperar contraseña', 'error');
    }
  });
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
  return str ? String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
