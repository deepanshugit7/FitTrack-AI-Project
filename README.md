# 💪 FitTrack AI

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

FitTrack AI is a personal project I built to solve a real problem — I wanted a clean, distraction-free way to log my workouts and actually *understand* my progress over time, not just record numbers blindly.

So I built one from scratch. No frameworks, no bloat. Just HTML, CSS, and vanilla JavaScript — and a small "AI" brain that tells you exactly what to lift next session based on how hard your last one felt.

---

## What it does

When you open the app, you're greeted with a simple login screen. Create an account and you'll land on a dashboard that gives you a quick snapshot of your training — how many sessions you've done, your total volume lifted, your best estimated one-rep max, and your current streak.

From there, it's four main areas:

**Dashboard** — Your home base. It shows your last 10 sessions plotted on a chart so you can see your volume trend at a glance, plus a quick list of recent workouts. The streak counter is a nice motivator too.

**Log Workout** — This is where you actually track your training. You give your session a name (like "Push Day"), pick the date, and start adding exercises. There's a built-in library of common lifts, but you can also add your own custom exercises and they'll save to your profile. For each exercise you log sets with weight, reps, and RPE (Rate of Perceived Exertion — basically how hard it felt on a scale of 1–10). A live timer runs in the background so you know how long your session took.

**History** — A clean, searchable list of every workout you've ever logged. You can filter by name, delete sessions you don't need, and scroll back through your entire training history.

**AI Predictions** — The fun part. Pick any exercise and the app looks at your history for that lift, plots your estimated 1RM over time, and tells you exactly what to aim for next session. It's not magic — it uses the Epley formula to estimate your theoretical max from any set, then adjusts the recommendation based on your last RPE score. Felt easy? It'll bump the weight up. Near your limit? It tells you to hold steady and focus on form.

---

## How the prediction engine works

Honestly, it's simpler than it sounds. There are two ideas behind it:

The first is the **Epley formula**, which is a well-known way to estimate your one-rep max from any set:

```
Estimated 1RM = Weight × (1 + Reps / 30)
```

The second is **RPE-based progressive overload** — essentially, how hard did that last set feel?

- If your RPE was 7.5 or under, the weight felt pretty easy. Add 2.5 kg next time.
- If it was around 8–8.5, you're in a good spot. A small 1.25 kg bump should be fine.
- If you hit a 9, don't push the weight — try squeezing out one more rep instead.
- If you were above 9, you were near failure. Don't increase anything; lock in your technique first.

It's the kind of logic a good coach would use. I just coded it up.

---

## Running it locally

There's no setup, no `npm install`, nothing like that. It's a plain static web app.

The only thing to keep in mind is that because it uses JavaScript ES Modules, you can't just double-click `index.html` and open it as a file — browsers block modules on `file://` URLs. You need to serve it over HTTP.

The easiest way if you have VS Code is the **Live Server** extension — just right-click `index.html` and hit "Open with Live Server." Otherwise:

```bash
# Python (comes with most machines)
python -m http.server 8080

# Or with Node
npx http-server .
```

Then open `http://localhost:8080`, register an account, and you're in. A couple of sample workouts get seeded to your account automatically so you can see the charts and predictions in action right away.

---

## Project layout

I tried to keep the code organized in a way that makes sense. It's not a massive app, but I still wanted clear separation between concerns:

```
FitTrack AI/
├── index.html          # The whole app lives in one HTML file
├── style.css           # All the styling — dark/light themes, layout, components
└── src/
    ├── main.js         # Entry point: handles auth, routing between tabs
    ├── modules/
    │   ├── state.js    # A single source of truth for app state
    │   └── storage.js  # All the localStorage read/write logic lives here
    ├── controllers/
    │   ├── dashboard.js    # Stats, streak, activity chart
    │   ├── logger.js       # The workout builder
    │   ├── history.js      # History list and delete
    │   └── predictions.js  # The AI engine and trend chart
    └── utils/
        └── ui-helpers.js   # Toasts, date formatting — small shared stuff
```

---

## Tech used

| What | Why |
|---|---|
| HTML5 + Vanilla CSS | Full control, no abstractions getting in the way |
| Vanilla JavaScript (ES Modules) | Wanted to prove you don't need React for everything |
| Chart.js | Clean, lightweight charts without a massive dependency |
| Lucide Icons | Crisp SVG icons, tiny footprint |
| localStorage | No backend needed — everything lives in the browser |