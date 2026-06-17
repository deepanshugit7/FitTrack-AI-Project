import { state, chartInstances } from '../modules/state.js';
import { formatDisplayDate } from '../utils/ui-helpers.js';

export function initDashboard() {
    if (!state.currentUser) return;

    document.getElementById("user-display-name").textContent = state.currentUser.name;
    document.getElementById("user-display-email").textContent = state.currentUser.email;
    document.getElementById("user-avatar-initial").textContent = state.currentUser.name.charAt(0).toUpperCase();
    document.getElementById("welcome-message").textContent = `Welcome, ${state.currentUser.name.split(' ')[0]}`;
    
    document.getElementById("today-date-string").textContent = formatDisplayDate(new Date());

    updateStats();
    renderRecentList();
    renderChart();
}

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
    const dates = [...new Set(workouts.map(w => w.date))].sort((a,b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    
    let streak = 0, expected = new Date(dates[0]);
    for (let d of dates) {
        if (Math.ceil(Math.abs(expected - new Date(d)) / 86400000) <= 1) {
            streak++;
            expected = new Date(d);
        } else break;
    }
    return streak;
}

function renderRecentList() {
    const list = document.getElementById("recent-workouts-list");
    const recent = [...(state.currentUser.workouts || [])].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    
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
                ${w.exercises.slice(0,2).map(ex => `<div style="font-size: 0.75rem; color: var(--text-secondary);">${ex.name}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderChart() {
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;
    if (chartInstances.dashboard) chartInstances.dashboard.destroy();

    const workouts = [...(state.currentUser.workouts || [])].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-10);
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const color = isDark ? "#ffffff" : "#000000";

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
                borderColor: color, borderWidth: 2, tension: 0, fill: false, pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#888' } },
                y: { grid: { color: isDark ? '#222' : '#f0f0f0' }, ticks: { font: { size: 10 }, color: '#888' } }
            }
        }
    });
}
