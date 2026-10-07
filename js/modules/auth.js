// ==========================================
// LIFEOS - AUTHENTICATION MODULE (SUPABASE AUTH)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { showToast } from '../components/notifications.js';

let currentUser = null;

export async function initAuth(onAuthChange) {
  if (supabaseClient) {
    // Escuchar cambios de sesión reales en Supabase
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
    }
    
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      onAuthChange(currentUser);
    });

    onAuthChange(currentUser);
  } else {
    // Modo local / demo sesión
    const savedDemoUser = localStorage.getItem('lifeos_demo_user');
    if (savedDemoUser) {
      currentUser = JSON.parse(savedDemoUser);
    } else {
      // Usuario demo por defecto
      currentUser = {
        id: 'demo-user-123',
        email: 'usuario@lifeos.app',
        user_metadata: { full_name: 'Jean' }
      };
      localStorage.setItem('lifeos_demo_user', JSON.stringify(currentUser));
    }
    onAuthChange(currentUser);
  }
}

export function getCurrentUser() {
  return currentUser;
}

export async function loginUser(email, password) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    return currentUser;
  } else {
    // Demo Login
    currentUser = {
      id: 'demo-user-123',
      email: email,
      user_metadata: { full_name: email.split('@')[0] }
    };
    localStorage.setItem('lifeos_demo_user', JSON.stringify(currentUser));
    return currentUser;
  }
}

export async function registerUser(email, password, fullName) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data.user;
  } else {
    currentUser = {
      id: crypto.randomUUID(),
      email: email,
      user_metadata: { full_name: fullName }
    };
    localStorage.setItem('lifeos_demo_user', JSON.stringify(currentUser));
    return currentUser;
  }
}

export async function resetPassword(email) {
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } else {
    showToast(`Instrucciones enviadas a ${email} (Modo Demo)`, 'info');
  }
}

export async function logoutUser() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  } else {
    localStorage.removeItem('lifeos_demo_user');
  }
  currentUser = null;
  window.location.reload();
}
