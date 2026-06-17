// Global App State & Constants
export const DEFAULT_EXERCISES = [
    "Bench Press (Barbell)",
    "Squat (Barbell)",
    "Deadlift (Barbell)",
    "Overhead Press (Barbell)",
    "Pull Up",
    "Barbell Curl",
    "Tricep Pushdown (Cable)",
    "Leg Press",
    "Lat Pulldown (Cable)",
    "Incline Dumbbell Bench Press"
];

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
