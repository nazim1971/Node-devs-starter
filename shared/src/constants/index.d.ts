export declare const API_ROUTES: {
    readonly AUTH: {
        readonly REGISTER: "/auth/register";
        readonly LOGIN: "/auth/login";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly FORGOT_PASSWORD: "/auth/forgot-password";
        readonly RESET_PASSWORD: "/auth/reset-password";
    };
    readonly USERS: {
        readonly BASE: "/users";
        readonly BY_ID: (id: string) => string;
        readonly BAN: (id: string) => string;
        readonly ROLE: (id: string) => string;
    };
    readonly ADMIN: {
        readonly STATS: "/admin/stats";
    };
    readonly UPLOAD: {
        readonly AVATAR: "/upload/avatar";
    };
};
export declare const PAGINATION_DEFAULTS: {
    readonly PAGE: 1;
    readonly LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export declare const TOKEN_EXPIRY: {
    readonly ACCESS: "15m";
    readonly REFRESH: "7d";
    readonly RESET_PASSWORD: "1h";
};
export declare const ROLES: {
    readonly ADMIN: "admin";
    readonly EDITOR: "editor";
    readonly USER: "user";
};
export declare const USER_STATUS: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly BANNED: "banned";
};
//# sourceMappingURL=index.d.ts.map