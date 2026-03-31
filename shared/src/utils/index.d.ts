export declare function formatDate(date: Date | string): string;
export declare function formatRelativeTime(date: Date | string): string;
export declare function truncate(str: string, length: number): string;
export declare function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function cn(...classes: (string | undefined | null | false)[]): string;
export declare function isTokenExpired(token: string): boolean;
export declare function parseJwt(token: string): Record<string, unknown>;
export declare function generateInitials(name: string): string;
export declare function formatFileSize(bytes: number): string;
export declare function validateImageFile(file: File): {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=index.d.ts.map