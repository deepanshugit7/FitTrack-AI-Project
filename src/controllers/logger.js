import { state, DEFAULT_EXERCISES, EXERCISE_CATALOG } from '../modules/state.js';
import { saveUserSession } from '../modules/storage.js';
import { showToast } from '../utils/ui-helpers.js';

export function initLogger() {
    document.getElementById("workout-date-input").value = new Date().toISOString().split('T')[0];
    if (!state.currentWorkout.startTime) {
        state.currentWorkout.startTime = Date.now();
        state.currentWorkout.date = document.getElementById("workout-date-input").value;
        state.currentWorkout.name = document.getElementById("workout-name-input").value || "New Session";
        clearInterval(state.timerInterval);
        state.timerInterval = setInterval(updateTimer, 1000);
    }
    renderExercises();
}

function updateTimer() {
    const total = Math.floor((Date.now() - state.currentWorkout.startTime) / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    document.getElementById("workout-timer").textContent = `${m}:${s}`;
}

export function renderExercises() {
    const container = document.getElementById("workout-exercises");
    if (!state.currentWorkout.exercises.length) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary); font-size: 0.875rem; border: 1px dashed var(--border-card); border-radius: 6px;">No exercises added yet.</div>';
        return;
    }

    container.innerHTML = state.currentWorkout.exercises.map((ex, i) => `
        <div class="exercise-log-card">
            <div class="exercise-header">
                <span style="font-weight: 600;">${ex.name}</span>
                <button onclick="window.app.removeExercise(${i})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);"><i data-lucide="trash-2"></i></button>
            </div>
            <div style="display:grid;grid-template-columns:40px 1fr 1fr 1fr 40px;gap:12px;margin-bottom:8px;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;text-align:center;">
                <div>Set</div><div>KG</div><div>Reps</div><div>RPE</div><div></div>
            </div>
            ${ex.sets.map((s, si) => `
                <div class="set-row">
                    <div class="set-index">${si+1}</div>
                    <input type="number" value="${s.weight}" onchange="window.app.updateSet(${i},${si},'weight',this.value)">
                    <input type="number" value="${s.reps}" onchange="window.app.updateSet(${i},${si},'reps',this.value)">
                    <input type="number" value="${s.rpe}" onchange="window.app.updateSet(${i},${si},'rpe',this.value)">
                    <button onclick="window.app.removeSet(${i},${si})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);"><i data-lucide="minus-circle" style="width:16px;"></i></button>
                </div>
            `).join('')}
            <button class="btn-secondary" style="width:100%;margin-top:16px;font-size:0.75rem;" onclick="window.app.addSet(${i})">Add Set</button>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

export function saveWorkout() {
    if (!state.currentWorkout.exercises.length) return showToast("Add exercises first.", "warning");
    
    const workout = {
        id: "w-" + Date.now(),
        name: document.getElementById("workout-name-input").value.trim() || "Workout Session",
        date: document.getElementById("workout-date-input").value || new Date().toISOString().split('T')[0],
        duration: document.getElementById("workout-timer").textContent + " mins",
        exercises: JSON.parse(JSON.stringify(state.currentWorkout.exercises))
    };

    if (!state.currentUser.workouts) state.currentUser.workouts = [];
    state.currentUser.workouts.push(workout);
    saveUserSession();
    
    state.currentWorkout = { id: null, name: "", date: "", exercises: [], startTime: null };
    clearInterval(state.timerInterval);
    document.getElementById("workout-timer").textContent = "00:00";
    showToast("Workout saved!", "success");
    window.app.showTab("dashboard");
}

export function renderExerciseOptions() {
    const list = document.getElementById("exercise-options-list");
    const searchInput = document.getElementById("exercise-search-input");
    const query = (searchInput?.value || "").trim().toLowerCase();

    // Build grouped catalog, plus any user-added custom exercises not in the catalog.
    const groups = { ...EXERCISE_CATALOG };
    const userExercises = state.currentUser.exercises || DEFAULT_EXERCISES;
    const customExercises = userExercises.filter(e => !DEFAULT_EXERCISES.includes(e));
    if (customExercises.length) groups["Custom"] = customExercises;

    const matches = (name) => !query || name.toLowerCase().includes(query);

    const escapeName = (e) => e.replace(/'/g, "\\'");

    const sections = Object.entries(groups).map(([group, exercises]) => {
        const filtered = exercises.filter(matches);
        if (!filtered.length) return "";
        return `
            <div style="padding:8px 12px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);background:var(--bg-secondary);position:sticky;top:0;">${group}</div>
            ${filtered.map(e => `
                <button class="btn-secondary" style="width:100%;border:none;border-bottom:1px solid var(--border-card);border-radius:0;padding:12px;text-align:left;" onclick="window.app.selectExercise('${escapeName(e)}')">${e}</button>
            `).join('')}
        `;
    }).join('');

    list.innerHTML = sections || '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:0.875rem;">No exercises match your search.</div>';
}
