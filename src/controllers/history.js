import { state } from '../modules/state.js';
import { saveUserSession } from '../modules/storage.js';
import { formatDisplayDate } from '../utils/ui-helpers.js';

export function renderHistory(query = "") {
    const container = document.getElementById("history-logs-container");
    const workouts = [...(state.currentUser.workouts || [])].sort((a,b) => new Date(b.date) - new Date(a.date));

    if (!workouts.length) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No history found.</div>`;
        return;
    }

    const filtered = workouts.filter(w => !query || w.name.toLowerCase().includes(query.toLowerCase()) || w.exercises.some(ex => ex.name.toLowerCase().includes(query.toLowerCase())));

    container.innerHTML = filtered.map(w => `
        <div style="border: 1px solid var(--border-card); border-radius: 6px; padding: 20px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <div>
                    <div style="font-weight: 700;">${w.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${formatDisplayDate(w.date)}</div>
                </div>
                <button class="btn-secondary" style="padding:4px 8px;font-size:0.75rem;color:var(--danger);" onclick="window.app.deleteWorkout('${w.id}')">Delete</button>
            </div>
            ${w.exercises.map(ex => `
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 0.875rem; font-weight: 600;">${ex.name}</div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${ex.sets.map(s => `<span style="font-size:0.7rem;background:var(--bg-secondary);padding:2px 6px;border-radius:4px;">${s.weight}kg x ${s.reps}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

export function deleteWorkout(id) {
    if (!confirm("Delete permanently?")) return;
    state.currentUser.workouts = state.currentUser.workouts.filter(w => w.id !== id);
    saveUserSession();
    renderHistory();
}
