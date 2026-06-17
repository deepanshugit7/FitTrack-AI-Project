import { state, chartInstances } from '../modules/state.js';
import { formatDisplayDate } from '../utils/ui-helpers.js';

export function initPredictions() {
    const dropdown = document.getElementById("predict-exercise-select");
    const unique = [...new Set((state.currentUser.workouts || []).flatMap(w => w.exercises.map(ex => ex.name)))].sort();
    
    if (!unique.length) {
        document.getElementById("predictions-dashboard-content").style.display = "none";
        document.getElementById("predictions-empty-state").style.display = "flex";
        dropdown.innerHTML = '<option value="" disabled selected>No exercises logged</option>';
        return;
    }

    dropdown.innerHTML = '<option value="" disabled selected>Select Exercise</option>' + unique.map(ex => `<option value="${ex}">${ex}</option>`).join('');
    if (unique.length) { dropdown.value = unique[0]; updatePanel(); }
}

export function updatePanel() {
    const name = document.getElementById("predict-exercise-select").value;
    if (!name) return;
    
    const data = (state.currentUser.workouts || []).sort((a,b) => new Date(a.date) - new Date(b.date)).map(w => {
        const found = w.exercises.find(ex => ex.name === name);
        if (!found) return null;
        let maxW = 0, reps = 0, rpe = 8;
        found.sets.forEach(s => { if (s.weight > maxW) { maxW = s.weight; reps = s.reps; rpe = s.rpe; } });
        return { date: w.date, maxWeight: maxW, reps, rpe, estimated1RM: maxW * (1 + reps / 30) };
    }).filter(p => p !== null);

    if (data.length < 2) {
        document.getElementById("predictions-dashboard-content").style.display = "none";
        document.getElementById("predictions-empty-state").style.display = "flex";
        return;
    }

    document.getElementById("predictions-empty-state").style.display = "none";
    document.getElementById("predictions-dashboard-content").style.display = "block";
    
    const latest = data[data.length - 1];
    let tw = latest.maxWeight, tr = latest.reps, expl = "";
    if (latest.rpe <= 7.5) { tw += 2.5; expl = "Felt easy. Increase weight."; }
    else if (latest.rpe <= 8.5) { tw += 1.25; expl = "Good load. Minor increase."; }
    else if (latest.rpe <= 9) { tr += 1; expl = "Push for one more rep."; }
    else { expl = "Near failure. Consolidate form."; }

    document.getElementById("predicted-load").textContent = `${tw} kg x ${tr} Reps`;
    document.getElementById("prediction-explanation").textContent = expl;
    document.getElementById("pred-current-1rm").textContent = `${Math.round(latest.estimated1RM)} kg`;
    document.getElementById("pred-target-1rm").textContent = `${Math.round(tw * (1 + tr / 30))} kg`;
    document.getElementById("pred-four-week-forecast").textContent = `${Math.round(latest.estimated1RM + 5)} kg`;

    renderChart(name, data);
}

function renderChart(name, data) {
    const ctx = document.getElementById("predictionChart").getContext('2d');
    if (chartInstances.prediction) chartInstances.prediction.destroy();
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const color = isDark ? "#ffffff" : "#000000";

    chartInstances.prediction = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(p => formatDisplayDate(p.date, true)),
            datasets: [{
                data: data.map(p => Math.round(p.estimated1RM)),
                borderColor: '#0070f3',
                backgroundColor: isDark ? 'rgba(0,112,243,0.12)' : 'rgba(0,112,243,0.08)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#0070f3',
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: 'easeInOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} kg (1RM)` } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#888' } },
                y: { grid: { color: isDark ? '#222' : '#f0f0f0' }, ticks: { font: { size: 10 }, color: '#888' } }
            }
        }
    });
}
