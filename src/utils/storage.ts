let clientPublicKey: any = null;

// Storage keys enum for type safety and maintainability
export enum StorageKeys {
    ACCESS_TOKEN = 'accessToken',
    REFRESH_TOKEN = 'refreshToken',
    REMEMBER_ME = 'rememberMe',
    REMEMBERED_USERNAME = 'rememberedUsername',
    REMEMBERED_PASSWORD = 'rememberedPassword',
    DPOP_BASE_URL = 'dpopBaseUrl',
    DPOP_PERSIST_BASE_URL = 'dpopPersistBaseUrl',
}

// Simple encryption for stored credentials (not production-grade, but better than plain text)
const encode = (str: string): string => {
    try {
        return btoa(encodeURIComponent(str));
    } catch {
        return str;
    }
};

const decode = (str: string): string => {
    try {
        return decodeURIComponent(atob(str));
    } catch {
        return str;
    }
};

// Storage utility with encryption support
export const storage = {
    // Token management (sessionStorage - cleared on browser close)
    setToken(token: string) {
        sessionStorage.setItem(StorageKeys.ACCESS_TOKEN, token);
    },

    getToken(): string | null {
        return sessionStorage.getItem(StorageKeys.ACCESS_TOKEN);
    },

    clearToken() {
        sessionStorage.removeItem(StorageKeys.ACCESS_TOKEN);
    },

    // Refresh token (optional - for longer sessions)
    setRefreshToken(token: string) {
        sessionStorage.setItem(StorageKeys.REFRESH_TOKEN, token);
    },

    getRefreshToken(): string | null {
        return sessionStorage.getItem(StorageKeys.REFRESH_TOKEN);
    },

    clearRefreshToken() {
        sessionStorage.removeItem(StorageKeys.REFRESH_TOKEN);
    },

    // Client keys management (in-memory only for security)
    setClientKeys: (key: CryptoKey) => {
        clientPublicKey = key;
    },

    getKey: () => clientPublicKey,

    clearKey: () => {
        clientPublicKey = null;
    },

    // Remember Me functionality (localStorage - persists across sessions)
    setRememberMe(enabled: boolean) {
        if (enabled) {
            localStorage.setItem(StorageKeys.REMEMBER_ME, 'true');
        } else {
            localStorage.removeItem(StorageKeys.REMEMBER_ME);
        }
    },

    getRememberMe(): boolean {
        return localStorage.getItem(StorageKeys.REMEMBER_ME) === 'true';
    },

    setRememberedUsername(username: string) {
        localStorage.setItem(StorageKeys.REMEMBERED_USERNAME, encode(username));
    },
    setRememberedPassword(password: string) {
        localStorage.setItem(StorageKeys.REMEMBERED_PASSWORD, encode(password));
    },
    getRememberedPassword(): string | null {
        const encoded = localStorage.getItem(StorageKeys.REMEMBERED_PASSWORD);
        return encoded ? decode(encoded) : null;
    },
    getRememberedUsername(): string | null {
        const encoded = localStorage.getItem(StorageKeys.REMEMBERED_USERNAME);
        return encoded ? decode(encoded) : null;
    },

    clearRememberedUsername() {
        localStorage.removeItem(StorageKeys.REMEMBERED_USERNAME);
    },

    clearRememberedPassword() {
        localStorage.removeItem(StorageKeys.REMEMBERED_PASSWORD);
    },

    // Clear all stored data (for logout)
    clearAll() {
        this.clearToken();
        this.clearRefreshToken();
        this.clearKey();
        this.clearRememberedUsername();
        this.clearRememberedPassword()
        this.setRememberMe(false);
    },

    // Clear only auth data (keep preferences)
    clearAuth() {
        this.clearToken();
        this.clearRefreshToken();
        this.clearKey();
    },

    setPersistedBaseUrl(url: string) {
        localStorage.setItem(StorageKeys.DPOP_BASE_URL, url);
    },

    getPersistedBaseUrl(): string | null {
        return localStorage.getItem(StorageKeys.DPOP_BASE_URL);
    },

    clearPersistedBaseUrl() {
        localStorage.removeItem(StorageKeys.DPOP_BASE_URL);
    },

    setShouldPersistBaseUrl(should: boolean) {
        if (should) {
            localStorage.setItem(StorageKeys.DPOP_PERSIST_BASE_URL, 'true');
        } else {
            localStorage.removeItem(StorageKeys.DPOP_PERSIST_BASE_URL);
        }
    },

    getShouldPersistBaseUrl(): boolean {
        return localStorage.getItem(StorageKeys.DPOP_PERSIST_BASE_URL) === 'true';
    },
};