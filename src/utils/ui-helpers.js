export function formatDisplayDate(dateStr, short = false) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return short 
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let iconName = type === "success" ? "check-circle" : (type === "danger" ? "alert-triangle" : "info");
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
