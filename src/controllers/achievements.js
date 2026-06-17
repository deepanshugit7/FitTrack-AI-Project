import { state } from '../modules/state.js';
import { saveUserSession } from '../modules/storage.js';

// ── Badge Definitions ──────────────────────────────────────────
export const BADGE_DEFS = [
    { id: 'first_workout',  icon: '🏋️', name: 'First Rep',      desc: 'Log your first workout',       check: (u) => u.workouts.length >= 1 },
    { id: 'five_workouts',  icon: '🔥', name: '5 Sessions',     desc: 'Log 5 workouts',                check: (u) => u.workouts.length >= 5 },
    { id: 'ten_workouts',   icon: '💪', name: '10 Sessions',    desc: 'Log 10 workouts',               check: (u) => u.workouts.length >= 10 },
    { id: 'twenty_five',    icon: '⚡', name: '25 Sessions',    desc: 'Log 25 workouts',               check: (u) => u.workouts.length >= 25 },
    { id: 'streak_3',       icon: '📅', name: '3-Day Streak',   desc: 'Work out 3 days in a row',     check: (u) => calcStreak(u.workouts) >= 3 },
    { id: 'streak_7',       icon: '🗓️', name: '7-Day Streak',   desc: 'Work out 7 days in a row',     check: (u) => calcStreak(u.workouts) >= 7 },
    { id: 'heavy_lifter',   icon: '🏆', name: 'Heavy Lifter',   desc: 'Log a set ≥ 100 kg',           check: (u) => u.workouts.some(w => w.exercises.some(ex => ex.sets.some(s => s.weight >= 100))) },
    { id: 'volume_1000',    icon: '📦', name: '1K Volume',      desc: 'Total volume ≥ 1,000 kg',      check: (u) => totalVolume(u.workouts) >= 1000 },
    { id: 'volume_10000',   icon: '🚀', name: '10K Volume',     desc: 'Total volume ≥ 10,000 kg',     check: (u) => totalVolume(u.workouts) >= 10000 },
    { id: 'variety',        icon: '🎯', name: 'Variety Pack',   desc: 'Log 5 different exercises',    check: (u) => uniqueExercises(u.workouts) >= 5 },
];

function calcStreak(workouts) {
    if (!workouts.length) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 0, expected = new Date(dates[0]);
    for (let d of dates) {
        if (Math.ceil(Math.abs(expected - new Date(d)) / 86400000) <= 1) { streak++; expected = new Date(d); }
        else break;
    }
    return streak;
}

function totalVolume(workouts) {
    let v = 0;
    workouts.forEach(w => w.exercises.forEach(ex => ex.sets.forEach(s => { v += (s.weight * s.reps); })));
    return v;
}

function uniqueExercises(workouts) {
    return new Set(workouts.flatMap(w => w.exercises.map(ex => ex.name))).size;
}

// ── Check & Unlock Badges ─────────────────────────────────────
export function checkAndUnlockBadges() {
    if (!state.currentUser) return [];
    if (!state.currentUser.badges) state.currentUser.badges = {};
    const user = state.currentUser;
    const newlyUnlocked = [];

    BADGE_DEFS.forEach(b => {
        if (!user.badges[b.id] && b.check(user)) {
            user.badges[b.id] = { unlockedAt: new Date().toISOString(), isNew: true };
            newlyUnlocked.push(b);
        }
    });

    if (newlyUnlocked.length) {
        saveUserSession();
        fireConfetti();
        newlyUnlocked.forEach(b => {
            import('../utils/ui-helpers.js').then(({ showToast }) => {
                showToast(`🏅 Badge unlocked: ${b.name}!`, 'success');
            });
        });
    }
    return newlyUnlocked;
}

// ── Render Badge Grid ─────────────────────────────────────────
export function renderBadges() {
    const grid = document.getElementById('badges-grid');
    if (!grid || !state.currentUser) return;
    const badges = state.currentUser.badges || {};

    grid.innerHTML = BADGE_DEFS.map(b => {
        const unlocked = !!badges[b.id];
        const isNew = unlocked && badges[b.id].isNew;
        return `
        <div class="badge-item ${unlocked ? '' : 'locked'}" title="${b.desc}">
            ${isNew ? '<span class="badge-new">NEW</span>' : ''}
            <span class="badge-icon">${b.icon}</span>
            <span class="badge-name">${b.name}</span>
        </div>`;
    }).join('');

    // Clear "new" flags after rendering
    Object.keys(badges).forEach(id => { if (badges[id].isNew) badges[id].isNew = false; });
}

// ── Confetti Burst ────────────────────────────────────────────
export function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const COLORS = ['#ffd700', '#0070f3', '#39d353', '#ff6b6b', '#c084fc', '#fb923c'];
    const particles = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: -10,
        r: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 4,
        life: 1,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1;
            p.rot += p.rotV; p.life -= 0.008;
            if (p.life <= 0 || p.y > canvas.height) return;
            alive = true;
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
            ctx.restore();
        });
        if (alive) requestAnimationFrame(draw);
        else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
    }
    draw();
}
