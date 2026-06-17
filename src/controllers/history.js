import { state } from '../modules/state.js';
import { saveUserSession } from '../modules/storage.js';
import { formatDisplayDate, showToast } from '../utils/ui-helpers.js';

export function renderHistory(query = "") {
    const container = document.getElementById("history-logs-container");
    const workouts = [...(state.currentUser.workouts || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!workouts.length) {
        container.innerHTML = `
            <div style="padding: 60px; text-align: center; color: var(--text-secondary);">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">📋</div>
                <div style="font-weight: 600; margin-bottom: 6px;">No history yet</div>
                <div style="font-size: 0.875rem;">Log your first workout to see it here.</div>
            </div>`;
        return;
    }

    const filtered = workouts.filter(w =>
        !query ||
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.exercises.some(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
    );

    // Show skeleton briefly
    container.innerHTML = filtered.map(w => {
        const totalVol = w.exercises.reduce((sum, ex) =>
            sum + ex.sets.reduce((s2, s) => s2 + (s.weight * s.reps), 0), 0);
        const totalSets = w.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

        return `
        <div style="border: 1px solid var(--border-card); border-radius: 8px; padding: 20px; margin-bottom: 12px; transition: border-color 0.2s;"
             onmouseenter="this.style.borderColor='var(--border-hover)'"
             onmouseleave="this.style.borderColor='var(--border-card)'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <div style="font-weight: 700; font-size: 1rem;">${w.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                        ${formatDisplayDate(w.date)} &nbsp;·&nbsp; ${w.exercises.length} exercise${w.exercises.length !== 1 ? 's' : ''} &nbsp;·&nbsp; ${totalSets} sets &nbsp;·&nbsp; ${Math.round(totalVol).toLocaleString()} kg
                    </div>
                </div>
                <button class="btn-secondary" style="padding:4px 8px;font-size:0.75rem;color:var(--danger);border-color:transparent;"
                    onclick="window.app.deleteWorkout('${w.id}')">Delete</button>
            </div>
            ${w.exercises.map(ex => `
                <div style="margin-bottom: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                    <div style="font-size: 0.875rem; font-weight: 600; margin-bottom: 6px;">${ex.name}</div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${ex.sets.map((s, si) => `
                            <span style="font-size:0.7rem;background:var(--bg-card);border:1px solid var(--border-card);padding:3px 8px;border-radius:4px;font-variant-numeric:tabular-nums;">
                                Set ${si + 1}: ${s.weight}kg × ${s.reps}
                            </span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

export function deleteWorkout(id) {
    if (!confirm("Delete this workout permanently?")) return;
    state.currentUser.workouts = state.currentUser.workouts.filter(w => w.id !== id);
    saveUserSession();
    renderHistory();
    showToast("Workout deleted.", "info");
}

// ── CSV Export ─────────────────────────────────────────────────
export function exportCSV() {
    const workouts = state.currentUser.workouts || [];
    if (!workouts.length) return showToast("No workouts to export.", "warning");

    const rows = [["Date", "Session Name", "Exercise", "Set", "Weight (kg)", "Reps", "RPE", "Estimated 1RM"]];
    workouts.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(w => {
        w.exercises.forEach(ex => {
            ex.sets.forEach((s, si) => {
                const orm = Math.round(s.weight * (1 + s.reps / 30));
                rows.push([w.date, w.name, ex.name, si + 1, s.weight, s.reps, s.rpe || '', orm]);
            });
        });
    });

    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-${state.currentUser.name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!", "success");
}
