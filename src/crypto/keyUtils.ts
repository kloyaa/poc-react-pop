import { getOrCreateDPoPKeyPair } from "./dpop";

export async function getPublicJwk(): Promise<JsonWebKey> {
    const { publicKey } = await getOrCreateDPoPKeyPair();
    return await crypto.subtle.exportKey("jwk", publicKey);
}

export async function getPrivateJwk(): Promise<JsonWebKey> {
    const { privateKey } = await getOrCreateDPoPKeyPair();
    return await crypto.subtle.exportKey("jwk", privateKey);
}
