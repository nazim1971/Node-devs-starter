"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatRelativeTime = formatRelativeTime;
exports.truncate = truncate;
exports.debounce = debounce;
exports.cn = cn;
exports.isTokenExpired = isTokenExpired;
exports.parseJwt = parseJwt;
exports.generateInitials = generateInitials;
exports.formatFileSize = formatFileSize;
exports.validateImageFile = validateImageFile;
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    if (diffSecs < 60)
        return "just now";
    if (diffMins < 60)
        return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7)
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffWeeks < 4)
        return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
    if (diffMonths < 12)
        return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
    return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
}
function truncate(str, length) {
    if (str.length <= length)
        return str;
    return `${str.slice(0, length)}...`;
}
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}
function isTokenExpired(token) {
    try {
        const payload = parseJwt(token);
        if (typeof payload["exp"] !== "number")
            return true;
        return Date.now() >= payload["exp"] * 1000;
    }
    catch {
        return true;
    }
}
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url)
            return {};
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(atob(base64)
            .split("")
            .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
            .join(""));
        return JSON.parse(jsonPayload);
    }
    catch {
        return {};
    }
}
function generateInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0] ?? "")
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
function formatFileSize(bytes) {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function validateImageFile(file) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: "Only JPEG, PNG, and WebP images are allowed",
        };
    }
    if (file.size > maxSizeBytes) {
        return { valid: false, error: "Image must be smaller than 5MB" };
    }
    return { valid: true };
}
//# sourceMappingURL=index.js.map