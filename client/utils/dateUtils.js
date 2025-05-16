export const DATE_FORMAT_OPTIONS = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
};

export function getTimeAgo(date) {
    const now = new Date(); // Using current time
    const diffMs = now - new Date(date);
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        const dateObj = new Date(date);
        return dateObj.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}
