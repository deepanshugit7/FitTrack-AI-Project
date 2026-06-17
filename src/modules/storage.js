import { state } from './state.js';

export function loadDatabase() {
    try {
        const storedUsers = localStorage.getItem("fittrack_users");
        state.users = storedUsers ? JSON.parse(storedUsers) : {};
    } catch (e) {
        console.error("Failed to load database", e);
        state.users = {};
    }
}

export function saveDatabase() {
    try {
        localStorage.setItem("fittrack_users", JSON.stringify(state.users));
    } catch (e) {
        console.error("Failed to save database", e);
    }
}

export function saveUserSession() {
    if (state.currentUser) {
        state.users[state.currentUser.email] = state.currentUser;
        saveDatabase();
        localStorage.setItem("fittrack_active_user", state.currentUser.email);
    }
}

export function clearSession() {
    localStorage.removeItem("fittrack_active_user");
    state.currentUser = null;
}
