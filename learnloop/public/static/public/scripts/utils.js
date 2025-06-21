export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

 export function calculateDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = new Date(dueDate);
    endDate.setHours(0, 0, 0, 0);

    const timeDiff = endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}
export function formatDateStatus(daysRemaining) {
    if (daysRemaining === null || daysRemaining === undefined) return 'Sem data';
    if (daysRemaining < 0) return `Atrasado há ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) > 1 ? 'dias' : 'dia'}`;
    if (daysRemaining === 0) return 'Vence hoje';
    return `Vence em ${daysRemaining} ${daysRemaining > 1 ? 'dias' : 'dia'}`;
}

export function getDateClass(daysRemaining) {
    if (daysRemaining === null || daysRemaining === undefined) return 'date-none';
    if (daysRemaining < 0) return 'date-overdue';
    return 'date-on-time';
}