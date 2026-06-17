import { state, chartInstances } from '../modules/state.js';
import { formatDisplayDate } from '../utils/ui-helpers.js';
import { renderBadges } from './achievements.js';

export function initDashboard() {
    if (!state.currentUser) return;

    document.getElementById("user-display-name").textContent = state.currentUser.name;
    document.getElementById("user-display-email").textContent = state.currentUser.email || '';
    document.getElementById("user-avatar-initial").textContent = state.currentUser.name.charAt(0).toUpperCase();
    document.getElementById("welcome-message").textContent = `Welcome, ${state.currentUser.name.split(' ')[0]}`;
    document.getElementById("today-date-string").textContent = formatDisplayDate(new Date());

    updateStats();
    renderRecentList();
    renderChart();
    renderHeatmap();
    renderWeeklyGoal();
    renderBadges();
}

// ── Stats ──────────────────────────────────────────────────────
function updateStats() {
    const workouts = state.currentUser.workouts || [];
    document.getElementById("stat-workouts").textContent = workouts.length;

    let vol = 0, peak = 0;
    workouts.forEach(w => w.exercises.forEach(ex => ex.sets.forEach(s => {
        vol += (s.weight * s.reps);
        const orm = s.weight * (1 + s.reps / 30);
        if (orm > peak) peak = orm;
    })));

    document.getElementById("stat-volume").textContent = Math.round(vol).toLocaleString();
    document.getElementById("stat-max-lift").textContent = `${Math.round(peak)} kg`;
    document.getElementById("stat-streak").textContent = calculateStreak(workouts);
}

function calculateStreak(workouts) {
    if (!workouts.length) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 0, expected = new Date(dates[0]);
    for (let d of dates) {
        if (Math.ceil(Math.abs(expected - new Date(d)) / 86400000) <= 1) {
            streak++; expected = new Date(d);
        } else break;
    }
    return streak;
}

// ── Recent List ────────────────────────────────────────────────
function renderRecentList() {
    const list = document.getElementById("recent-workouts-list");
    const recent = [...(state.currentUser.workouts || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

    if (!recent.length) {
        list.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.875rem;">No sessions yet.</div>`;
        return;
    }

    list.innerHTML = recent.map(w => `
        <div class="history-card">
            <div class="history-header">
                <div class="history-date">${w.name}</div>
                <div class="history-duration">${formatDisplayDate(w.date, true)}</div>
            </div>
            <div class="history-body">
                ${w.exercises.slice(0, 2).map(ex => `<div style="font-size: 0.75rem; color: var(--text-secondary);">${ex.name}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

// ── Main Chart (animated) ──────────────────────────────────────
function renderChart() {
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;
    if (chartInstances.dashboard) chartInstances.dashboard.destroy();

    const workouts = [...(state.currentUser.workouts || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10);
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const accentColor = '#0070f3';

    chartInstances.dashboard = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: workouts.map(w => formatDisplayDate(w.date, true)),
            datasets: [{
                data: workouts.map(w => {
                    let v = 0;
                    w.exercises.forEach(ex => ex.sets.forEach(s => v += (s.weight * s.reps)));
                    return v;
                }),
                borderColor: accentColor,
                backgroundColor: isDark
                    ? 'rgba(0, 112, 243, 0.12)'
                    : 'rgba(0, 112, 243, 0.08)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: accentColor,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart',
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} kg volume`,
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#888' } },
                y: {
                    grid: { color: isDark ? '#222' : '#f0f0f0' },
                    ticks: { font: { size: 10 }, color: '#888' }
                }
            },
            onClick: (evt, elements) => {
                if (!elements.length) return;
                const idx = elements[0].index;
                const workout = workouts[idx];
                if (!workout) return;
                showWorkoutDrilldown(workout);
            }
        }
    });
}

function showWorkoutDrilldown(workout) {
    const lines = workout.exercises.map(ex =>
        `<b>${ex.name}</b>: ` + ex.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')
    ).join('<br>');

    import('../utils/ui-helpers.js').then(({ showToast }) => {
        showToast(`${workout.name} — ${workout.exercises.length} exercises`, 'info');
    });

    // show a mini modal
    let existing = document.getElementById('drilldown-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'drilldown-popup';
    popup.style.cssText = `
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:var(--bg-card);border:1px solid var(--border-card);
        border-radius:12px;padding:28px;max-width:400px;width:90%;
        box-shadow:var(--shadow-md);z-index:1001;animation:fadeIn 0.2s ease;
    `;
    popup.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div>
                <div style="font-weight:700;font-size:1rem;">${workout.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);">${formatDisplayDate(workout.date)}</div>
            </div>
            <button onclick="document.getElementById('drilldown-popup').remove()"
                style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.2rem;">✕</button>
        </div>
        <div style="font-size:0.85rem;line-height:1.8;">${lines}</div>
    `;
    document.body.appendChild(popup);
    // close on outside click
    setTimeout(() => {
        document.addEventListener('click', function h(e) {
            if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', h); }
        });
    }, 100);
}

// ── Heatmap ────────────────────────────────────────────────────
export function renderHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    const monthsEl = document.getElementById('heatmap-months');
    if (!grid) return;

    const WEEKS = 16;
    const workouts = state.currentUser.workouts || [];

    // Build day → volume map
    const dayMap = {};
    workouts.forEach(w => {
        let vol = 0;
        w.exercises.forEach(ex => ex.sets.forEach(s => vol += s.weight * s.reps));
        if (!dayMap[w.date]) dayMap[w.date] = { vol: 0, names: [] };
        dayMap[w.date].vol += vol;
        dayMap[w.date].names.push(w.name);
    });

    // Start from Sunday of 16 weeks ago
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (WEEKS * 7) + 1 - today.getDay());

    const allDays = [];
    for (let i = 0; i < WEEKS * 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        allDays.push(d);
    }

    // Compute max volume for scaling
    const volumes = allDays.map(d => (dayMap[d.toISOString().split('T')[0]]?.vol || 0));
    const maxVol = Math.max(...volumes, 1);

    grid.innerHTML = allDays.map(d => {
        const key = d.toISOString().split('T')[0];
        const entry = dayMap[key];
        const vol = entry?.vol || 0;
        const ratio = vol / maxVol;
        const level = vol === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
        const label = entry ? `${key}\n${entry.names.join(', ')}\n${Math.round(vol).toLocaleString()} kg` : key;
        return `<div class="heatmap-cell" data-level="${level}" data-tip="${label}" data-date="${key}"></div>`;
    }).join('');

    // Month labels
    const monthsSeen = new Set();
    const monthLabels = allDays.filter(d => {
        const m = d.toLocaleString('en', { month: 'short' });
        if (d.getDate() <= 7 && !monthsSeen.has(m)) { monthsSeen.add(m); return true; }
        return false;
    });
    monthsEl.innerHTML = monthLabels.map(d => `<span>${d.toLocaleString('en', { month: 'short' })}</span>`).join('');

    // Tooltip logic
    const tooltip = document.getElementById('heatmap-tooltip');
    grid.querySelectorAll('.heatmap-cell').forEach(cell => {
        cell.addEventListener('mouseenter', e => {
            const lines = e.target.dataset.tip.split('\n');
            tooltip.innerHTML = `<div style="font-weight:600;">${lines[0]}</div>${lines.slice(1).map(l => `<div style="color:var(--text-secondary)">${l}</div>`).join('')}`;
            tooltip.style.display = 'block';
        });
        cell.addEventListener('mousemove', e => {
            tooltip.style.left = (e.clientX + 12) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
        });
        cell.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    });
}

// ── Weekly Goal Ring ───────────────────────────────────────────
export function renderWeeklyGoal() {
    const goal = parseInt(localStorage.getItem('fittrack_weekly_goal') || '4');
    const input = document.getElementById('weekly-goal-input');
    if (input) input.value = goal;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekKey = startOfWeek.toISOString().split('T')[0];

    const thisWeek = (state.currentUser.workouts || []).filter(w => w.date >= weekKey).length;
    const pct = Math.min(thisWeek / goal, 1);
    const circumference = 238.76;
    const offset = circumference * (1 - pct);

    const ring = document.getElementById('goal-ring-progress');
    const count = document.getElementById('goal-ring-count');
    const total = document.getElementById('goal-ring-total');
    const desc  = document.getElementById('goal-ring-desc');

    if (ring) ring.setAttribute('stroke-dashoffset', offset);
    if (count) count.textContent = thisWeek;
    if (total) total.textContent = goal;
    if (desc) {
        const remaining = Math.max(goal - thisWeek, 0);
        desc.textContent = pct >= 1
            ? '🎉 Weekly goal achieved!'
            : `${remaining} more session${remaining !== 1 ? 's' : ''} to hit your goal.`;
    }
    if (ring) ring.setAttribute('stroke', pct >= 1 ? '#39d353' : '#0070f3');
}
