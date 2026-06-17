import { state, DEFAULT_EXERCISES, EXERCISE_CATALOG } from '../modules/state.js';
import { saveUserSession } from '../modules/storage.js';
import { showToast } from '../utils/ui-helpers.js';
import { checkAndUnlockBadges } from './achievements.js';

// ── Rest Timer ─────────────────────────────────────────────────
let _restInterval = null;
let _restRemaining = 0;
const REST_DURATION = 60;
const CIRCUMFERENCE = 169.6; // 2π × 27

window.restTimer = {
    start(seconds = REST_DURATION) {
        clearInterval(_restInterval);
        _restRemaining = seconds;
        const overlay = document.getElementById('rest-timer-overlay');
        const ring    = document.getElementById('rest-ring-prog');
        const countEl = document.getElementById('rest-timer-count');
        overlay.classList.add('visible');

        function tick() {
            _restRemaining--;
            const pct = _restRemaining / seconds;
            const offset = CIRCUMFERENCE * (1 - pct);
            ring.setAttribute('stroke-dashoffset', offset);
            countEl.textContent = _restRemaining + 's';
            ring.style.stroke = _restRemaining <= 10 ? '#ee0000' : '#0070f3';
            if (_restRemaining <= 0) {
                clearInterval(_restInterval);
                countEl.classList.add('rest-timer-done');
                countEl.textContent = '✓ Done!';
                _playBeep();
                setTimeout(() => {
                    overlay.classList.remove('visible');
                    countEl.classList.remove('rest-timer-done');
                }, 2000);
            }
        }
        tick();
        _restInterval = setInterval(tick, 1000);
    },
    skip() {
        clearInterval(_restInterval);
        document.getElementById('rest-timer-overlay')?.classList.remove('visible');
    },
    addTime(s) {
        _restRemaining += s;
    }
};

function _playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
}

// ── Sparkline Tooltip ──────────────────────────────────────────
let _sparkChart = null;

function showSparkline(name, x, y) {
    const tooltip = document.getElementById('sparkline-tooltip');
    const canvas  = document.getElementById('sparkline-canvas');
    if (!tooltip || !canvas) return;

    const history = (state.currentUser.workouts || [])
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(w => {
            const ex = w.exercises.find(e => e.name === name);
            if (!ex) return null;
            return { date: w.date, max: Math.max(...ex.sets.map(s => s.weight)) };
        }).filter(Boolean).slice(-6);

    if (history.length < 2) return;

    if (_sparkChart) { _sparkChart.destroy(); _sparkChart = null; }
    _sparkChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: history.map(h => h.date.slice(5)),
            datasets: [{ data: history.map(h => h.max), borderColor: '#0070f3', borderWidth: 2, pointRadius: 2, tension: 0.3, fill: false }]
        },
        options: {
            animation: false,
            responsive: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });

    tooltip.style.display = 'block';
    tooltip.style.left = (x + 14) + 'px';
    tooltip.style.top  = (y - 10) + 'px';
}

function hideSparkline() {
    document.getElementById('sparkline-tooltip').style.display = 'none';
}

// ── PR Detection ───────────────────────────────────────────────
function detectPR(exerciseName, currentSets) {
    const past = (state.currentUser.workouts || []);
    let bestPrev = 0;
    past.forEach(w => {
        const ex = w.exercises.find(e => e.name === exerciseName);
        if (ex) ex.sets.forEach(s => {
            const orm = s.weight * (1 + s.reps / 30);
            if (orm > bestPrev) bestPrev = orm;
        });
    });
    let bestCurrent = 0;
    currentSets.forEach(s => {
        const orm = (s.weight || 0) * (1 + (s.reps || 0) / 30);
        if (orm > bestCurrent) bestCurrent = orm;
    });
    return bestCurrent > bestPrev && bestCurrent > 0;
}

// ── Logger Init ────────────────────────────────────────────────
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

// ── Render Exercises (with Drag & Drop + Sparkline + Rest Button) ─
export function renderExercises() {
    const container = document.getElementById("workout-exercises");
    if (!state.currentWorkout.exercises.length) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary); font-size: 0.875rem; border: 1px dashed var(--border-card); border-radius: 6px;">No exercises added yet.</div>';
        return;
    }

    container.innerHTML = state.currentWorkout.exercises.map((ex, i) => {
        const isPR = detectPR(ex.name, ex.sets);
        const prBadge = isPR ? '<span class="pr-banner">🎉 PR!</span>' : '';
        return `
        <div class="exercise-log-card" draggable="true" data-idx="${i}">
            <div class="exercise-header">
                <div style="display:flex;align-items:center;gap:6px;flex:1;">
                    <span class="drag-handle"><i data-lucide="grip-vertical" style="width:14px;height:14px;"></i></span>
                    <button class="exercise-name-btn"
                        onmouseenter="window.loggerSparkline.show('${ex.name.replace(/'/g, "\\'")}', event)"
                        onmouseleave="window.loggerSparkline.hide()"
                    >${ex.name}</button>
                    ${prBadge}
                </div>
                <button onclick="window.app.removeExercise(${i})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);"><i data-lucide="trash-2"></i></button>
            </div>
            <div style="display:grid;grid-template-columns:40px 1fr 1fr 1fr 1fr 40px;gap:12px;margin-bottom:8px;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;text-align:center;">
                <div>Set</div><div>KG</div><div>Reps</div><div>RPE</div><div>Rest</div><div></div>
            </div>
            ${ex.sets.map((s, si) => `
                <div class="set-row" style="grid-template-columns:40px 1fr 1fr 1fr 1fr 40px;">
                    <div class="set-index">${si + 1}</div>
                    <input type="number" value="${s.weight}" onchange="window.app.updateSet(${i},${si},'weight',this.value)">
                    <input type="number" value="${s.reps}"   onchange="window.app.updateSet(${i},${si},'reps',this.value)">
                    <input type="number" value="${s.rpe}"    onchange="window.app.updateSet(${i},${si},'rpe',this.value)">
                    <button class="btn-secondary" style="padding:4px 6px;font-size:0.65rem;" onclick="window.restTimer.start(60)">⏱ Rest</button>
                    <button onclick="window.app.removeSet(${i},${si})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);"><i data-lucide="minus-circle" style="width:16px;"></i></button>
                </div>
            `).join('')}
            <button class="btn-secondary" style="width:100%;margin-top:16px;font-size:0.75rem;" onclick="window.app.addSet(${i})">Add Set</button>
        </div>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    setupDragDrop();
}

// ── Drag & Drop ────────────────────────────────────────────────
function setupDragDrop() {
    const cards = document.querySelectorAll('.exercise-log-card[draggable="true"]');
    let dragSrc = null;

    cards.forEach(card => {
        card.addEventListener('dragstart', e => {
            dragSrc = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            cards.forEach(c => c.classList.remove('drag-over'));
        });
        card.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (card !== dragSrc) {
                cards.forEach(c => c.classList.remove('drag-over'));
                card.classList.add('drag-over');
            }
        });
        card.addEventListener('drop', e => {
            e.preventDefault();
            if (dragSrc && dragSrc !== card) {
                const fromIdx = parseInt(dragSrc.dataset.idx);
                const toIdx   = parseInt(card.dataset.idx);
                const exercises = state.currentWorkout.exercises;
                const [moved] = exercises.splice(fromIdx, 1);
                exercises.splice(toIdx, 0, moved);
                renderExercises();
            }
        });
    });
}

// ── Save Workout ───────────────────────────────────────────────
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

    // Check PRs before resetting
    state.currentWorkout.exercises.forEach(ex => {
        if (detectPR(ex.name, ex.sets)) {
            showToast(`🏆 New PR on ${ex.name}!`, 'success');
        }
    });

    // Check achievements
    checkAndUnlockBadges();

    // Reset
    state.currentWorkout = { id: null, name: "", date: "", exercises: [], startTime: null };
    clearInterval(state.timerInterval);
    document.getElementById("workout-timer").textContent = "00:00";
    document.getElementById("workout-name-input").value = "";
    window.restTimer.skip();
    showToast("Workout saved!", "success");
    window.app.showTab("dashboard");
}

// ── Exercise Options ───────────────────────────────────────────
export function renderExerciseOptions() {
    const list = document.getElementById("exercise-options-list");
    const searchInput = document.getElementById("exercise-search-input");
    const query = (searchInput?.value || "").trim().toLowerCase();

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

// ── Expose sparkline helpers ───────────────────────────────────
window.loggerSparkline = {
    show: (name, e) => showSparkline(name, e.clientX, e.clientY),
    hide: hideSparkline,
};
