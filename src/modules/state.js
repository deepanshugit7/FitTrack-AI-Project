// Global App State & Constants

// Exercise library grouped by muscle group.
// Sourced from the Gym Exercise Directory (equipment-based gym movements).
export const EXERCISE_CATALOG = {
    "Chest": [
        "Barbell Bench Press",
        "Incline Barbell Bench Press",
        "Decline Barbell Bench Press",
        "Dumbbell Bench Press",
        "Incline Dumbbell Press",
        "Decline Dumbbell Press",
        "Flat Dumbbell Fly",
        "Incline Dumbbell Fly",
        "Decline Dumbbell Fly",
        "Cable Crossover (High-to-Low)",
        "Cable Fly (Low-to-High)",
        "Horizontal Cable Fly",
        "Pec Deck Fly Machine",
        "Seated Machine Chest Press",
        "Incline Lever/Hammer Strength Press",
        "Decline Hammer Strength Press",
        "Smith Machine Bench Press",
        "Weighted Chest Dips",
        "Svend Press (Plate Press)"
    ],
    "Back": [
        "Conventional Barbell Deadlift",
        "Barbell Bent-Over Row",
        "Pendlay Row",
        "One-Arm Dumbbell Row",
        "Wide-Grip Lat Pulldown",
        "Close-Grip / V-Bar Lat Pulldown",
        "Behind-the-Neck Lat Pulldown",
        "Seated Cable Row (V-Bar)",
        "Wide-Grip Cable Row",
        "One-Arm Seated Cable Row",
        "T-Bar Row (Chest-Supported)",
        "Meadows Row",
        "Straight-Arm Cable Pull-down",
        "Hammer Strength Iso-Lateral Row",
        "Weighted Pull-Ups",
        "Rack Pulls",
        "Hyperextensions (Weighted)",
        "Barbell Shrugs",
        "Dumbbell Shrugs",
        "Kirk Shrugs"
    ],
    "Shoulders": [
        "Overhead Barbell Press (OHP)",
        "Seated Dumbbell Shoulder Press",
        "Seated Barbell Overhead Press",
        "Arnold Press",
        "Standing Dumbbell Lateral Raise",
        "Seated Dumbbell Lateral Raise",
        "Cable Lateral Raise (Behind Back/Front)",
        "Machine Lateral Raise",
        "Dumbbell Front Raise",
        "Cable Front Raise",
        "Rear Deltoid Dumbbell Fly (Bent-over)",
        "Rear Deltoid Face Pulls",
        "Reverse Pec Deck Fly",
        "Incline Bench Rear Deltoid Row",
        "Smith Machine Overhead Press",
        "Barbell Upright Row"
    ],
    "Legs & Lower Body": [
        "Barbell Back Squat",
        "Barbell Front Squat",
        "Romanian Deadlift (RDL)",
        "Leg Press (45-Degree)",
        "Hack Squat",
        "V-Squat Machine",
        "Seated Leg Extension",
        "Seated Leg Curl",
        "Lying Leg Curl",
        "Standing Single-Leg Curl Machine",
        "Barbell Hip Thrust",
        "Glute Drive Machine Hip Thrust",
        "Walking Dumbbell Lunges",
        "Bulgarian Split Squat",
        "Smith Machine Squat",
        "Seated Calf Raise",
        "Standing Calf Raise",
        "Leg Press Calf Press",
        "Hip Abduction Machine",
        "Hip Adduction Machine"
    ],
    "Arms": [
        "Barbell Bicep Curl",
        "Dumbbell Alternating Bicep Curl",
        "Incline Dumbbell Curl",
        "Dumbbell Hammer Curl",
        "Preacher Curl (Barbell/EZ-Bar)",
        "Machine Bicep Curl",
        "Cable Bicep Curl",
        "Concentration Curl",
        "Spider Curl",
        "Triceps Cable Pushdown (Straight/V-Bar)",
        "Triceps Rope Overhead Extension",
        "Skull Crushers (Lying Triceps Extension)",
        "Close-Grip Barbell Bench Press",
        "Seated Overhead Dumbbell Extension",
        "Dumbbell Triceps Kickback",
        "Triceps Dip Machine",
        "Barbell Wrist Curls (Over/Under)"
    ],
    "Core & Abs": [
        "Kneeling Cable Crunch",
        "Seated Abdominal Crunch Machine",
        "Cable Woodchoppers",
        "Pallof Press",
        "Captain's Chair Leg / Knee Raise",
        "Hanging Toes-to-Bar",
        "Decline Weighted Sit-Up",
        "Weighted Russian Twists"
    ]
};

// Flat list of all built-in exercises (derived from the catalog above).
export const DEFAULT_EXERCISES = Object.values(EXERCISE_CATALOG).flat();

export let state = {
    users: {},            
    currentUser: null,    
    activeTab: "dashboard",
    currentWorkout: {
        id: null,
        name: "",
        date: "",
        exercises: [],
        startTime: null
    },
    timerInterval: null
};

export let chartInstances = {
    dashboard: null,
    prediction: null
};
