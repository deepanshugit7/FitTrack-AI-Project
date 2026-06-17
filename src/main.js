import { state, DEFAULT_EXERCISES } from './modules/state.js';
import { loadDatabase, saveDatabase, saveUserSession, clearSession } from './modules/storage.js';
import { showToast } from './utils/ui-helpers.js';
import { initDashboard } from './controllers/dashboard.js';
import { initLogger, renderExercises, saveWorkout, renderExerciseOptions } from './controllers/logger.js';
import { renderHistory, deleteWorkout } from './controllers/history.js';
import { initPredictions, updatePanel } from './controllers/predictions.js';

// Seed data helper
const getSeedWorkouts = () => {
    const today = new Date();
    const daysAgo = (n) => {
        const d = new Date(today);
        d.setDate(today.getDate() - n);
        return d.toISOString().split('T')[0];
    };
    return [
        { id: "w-1", name: "Push Day", date: daysAgo(7), duration: "45 mins", exercises: [{ name: "Bench Press (Barbell)", sets: [{ weight: 60, reps: 8, rpe: 8 }] }] },
        { id: "w-2", name: "Leg Day", date: daysAgo(4), duration: "50 mins", exercises: [{ name: "Squat (Barbell)", sets: [{ weight: 80, reps: 6, rpe: 8 }] }] }
    ];
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadDatabase();
    initTheme();
    setupEventListeners();
    checkActiveSession();
    if (window.lucide) window.lucide.createIcons();
});

function initTheme() {
    const theme = localStorage.getItem("fittrack_theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    document.getElementById("theme-toggle-btn").innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
    if (window.lucide) window.lucide.createIcons();
}

function checkActiveSession() {
    const email = localStorage.getItem("fittrack_active_user");
    if (email && state.users[email]) {
        state.currentUser = state.users[email];
        document.getElementById("auth-overlay").classList.add("hidden");
        initDashboard();
    }
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".sidebar-item").forEach(item => {
        item.addEventListener("click", () => showTab(item.getAttribute("data-tab")));
    });

    // Theme & Auth
    document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);
    document.getElementById("logout-btn").addEventListener("click", logout);
    document.getElementById("login-form").addEventListener("submit", login);
    document.getElementById("register-form").addEventListener("submit", register);
    document.getElementById("toggle-to-register").addEventListener("click", () => {
        document.getElementById("login-form-section").style.display = "none";
        document.getElementById("register-form-section").style.display = "block";
    });
    document.getElementById("toggle-to-login").addEventListener("click", () => {
        document.getElementById("register-form-section").style.display = "none";
        document.getElementById("login-form-section").style.display = "block";
    });

    // Logger
    document.getElementById("add-exercise-btn").addEventListener("click", () => {
        document.getElementById("exercise-modal").classList.add("active");
        renderExerciseOptions();
    });
    document.getElementById("close-exercise-modal-btn").addEventListener("click", () => {
        document.getElementById("exercise-modal").classList.remove("active");
    });
    document.getElementById("create-exercise-btn").addEventListener("click", () => {
        const input = document.getElementById("new-exercise-input");
        const name = input.value.trim();
        if (!name) return;
        if (!state.currentUser.exercises) state.currentUser.exercises = [...DEFAULT_EXERCISES];
        if (!state.currentUser.exercises.includes(name)) {
            state.currentUser.exercises.push(name);
            saveUserSession();
            renderExerciseOptions();
        }
        input.value = "";
    });
    document.getElementById("save-workout-btn").addEventListener("click", saveWorkout);
    document.getElementById("history-search").addEventListener("input", (e) => renderHistory(e.target.value));
    document.getElementById("predict-exercise-select").addEventListener("change", updatePanel);
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fittrack_theme", theme);
    updateThemeIcon(theme);
    if (state.currentUser) showTab(state.activeTab);
}

function showTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll(".sidebar-item").forEach(i => i.classList.toggle("active", i.getAttribute("data-tab") === tabId));
    document.querySelectorAll(".view-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${tabId}`));
    
    if (tabId === "dashboard") initDashboard();
    else if (tabId === "logger") initLogger();
    else if (tabId === "history") renderHistory();
    else if (tabId === "predictions") initPredictions();
}

function login(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    if (state.users[email] && state.users[email].password === password) {
        state.currentUser = state.users[email];
        localStorage.setItem("fittrack_active_user", email);
        document.getElementById("auth-overlay").classList.add("hidden");
        initDashboard();
        showToast("Welcome back!", "success");
    } else showToast("Invalid credentials", "danger");
}

function register(e) {
    e.preventDefault();
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value;
    if (state.users[email]) return showToast("User exists", "danger");
    
    state.users[email] = { name, password, workouts: getSeedWorkouts(), exercises: [...DEFAULT_EXERCISES] };
    saveDatabase();
    state.currentUser = state.users[email];
    localStorage.setItem("fittrack_active_user", email);
    document.getElementById("auth-overlay").classList.add("hidden");
    initDashboard();
    showToast("Account created!", "success");
}

function logout() {
    clearSession();
    document.getElementById("auth-overlay").classList.remove("hidden");
}

// Global Exports for inline events
window.app = {
    showTab,
    updateSet: (ei, si, f, v) => {
        if (state.currentWorkout.exercises[ei]?.sets[si]) {
            state.currentWorkout.exercises[ei].sets[si][f] = parseFloat(v) || "";
        }
    },
    addSet: (ei) => {
        const ex = state.currentWorkout.exercises[ei];
        const last = ex.sets[ex.sets.length - 1];
        ex.sets.push({ weight: last?.weight || "", reps: last?.reps || "", rpe: last?.rpe || 8 });
        renderExercises();
    },
    removeSet: (ei, si) => {
        state.currentWorkout.exercises[ei].sets.splice(si, 1);
        renderExercises();
    },
    removeExercise: (ei) => {
        state.currentWorkout.exercises.splice(ei, 1);
        renderExercises();
    },
    selectExercise: (name) => {
        state.currentWorkout.exercises.push({ name, sets: [{ weight: "", reps: "", rpe: 8 }] });
        document.getElementById("exercise-modal").classList.remove("active");
        renderExercises();
    },
    deleteWorkout
};
