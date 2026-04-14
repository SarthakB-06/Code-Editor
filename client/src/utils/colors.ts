export const getCursorColorIndex = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i += 1) {
        hash = (hash * 31 + userId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 4;
};

export const getAccentClasses = (userId: string) => {
    const idx = getCursorColorIndex(userId);
    if (idx === 1) return { border: "border-tertiary/40", dot: "bg-tertiary" };
    if (idx === 2) return { border: "border-error/40", dot: "bg-error" };
    if (idx === 3)
        return { border: "border-secondary-fixed/40", dot: "bg-secondary-fixed" };
    return { border: "border-primary/40", dot: "bg-primary" };
};

