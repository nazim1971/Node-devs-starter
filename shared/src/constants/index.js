"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_STATUS = exports.ROLES = exports.TOKEN_EXPIRY = exports.PAGINATION_DEFAULTS = exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    AUTH: {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: "/auth/reset-password",
    },
    USERS: {
        BASE: "/users",
        BY_ID: (id) => `/users/${id}`,
        BAN: (id) => `/users/${id}/ban`,
        ROLE: (id) => `/users/${id}/role`,
    },
    ADMIN: {
        STATS: "/admin/stats",
    },
    UPLOAD: {
        AVATAR: "/upload/avatar",
    },
};
exports.PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
};
exports.TOKEN_EXPIRY = {
    ACCESS: "15m",
    REFRESH: "7d",
    RESET_PASSWORD: "1h",
};
exports.ROLES = {
    ADMIN: "admin",
    EDITOR: "editor",
    USER: "user",
};
exports.USER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    BANNED: "banned",
};
//# sourceMappingURL=index.js.map