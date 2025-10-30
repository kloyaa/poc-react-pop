import { getPublicJwk } from "../crypto/keyUtils";
import { storage } from "../utils/storage";
import api from "./api";

export async function registerUser(payload: any) {
    const clientPublicKey = await getPublicJwk();
    return api.post("/auth/register", { ...payload, clientPublicKey });
}

export async function loginUser(loginIdentifier: string, password: string) {
    const clientPublicKey = await getPublicJwk();
    const res = await api.post("/auth/login", { loginIdentifier, password, clientPublicKey });
    const token = res.data?.accessToken;
    if (token) storage.setToken(token);
    return token;
}

export function logoutUser() {
    storage.clearToken();
    storage.clearAll(); // Clears everything including remember me if needed
}
