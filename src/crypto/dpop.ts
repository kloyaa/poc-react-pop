// src/crypto/dpop.ts
import { v4 as uuidv4 } from 'uuid';

const DPOP_KEY_NAME = 'dpop_keypair_v1';

// Load or generate a persistent keypair (securely stored in IndexedDB)
export async function getOrCreateDPoPKeyPair(): Promise<CryptoKeyPair> {
    const existing = await indexedDBGet(DPOP_KEY_NAME);
    if (existing) return existing;

    const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
    );

    await indexedDBSet(DPOP_KEY_NAME, keyPair);
    return keyPair;
}

async function indexedDBGet(key: string): Promise<CryptoKeyPair | null> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dpop-db', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('keys');
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('keys', 'readonly');
            const store = tx.objectStore('keys');
            const getReq = store.get(key);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = reject;
        };
        request.onerror = reject;
    });
}

async function indexedDBSet(key: string, value: CryptoKeyPair): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dpop-db', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('keys');
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('keys', 'readwrite');
            tx.objectStore('keys').put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = reject;
        };
        request.onerror = reject;
    });
}

export async function createDPoPProof(url: string, method: string): Promise<string> {
    const keyPair = await getOrCreateDPoPKeyPair();
    const jti = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: 'ES256',
        typ: 'dpop+jwt',
        jwk: await crypto.subtle.exportKey('jwk', keyPair.publicKey),
    };

    const payload = {
        htm: method.toUpperCase(),
        htu: url,
        jti,
        iat: now,
    };

    const enc = (obj: any) =>
        btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const headerB64 = enc(header);
    const payloadB64 = enc(payload);
    const toSign = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, toSign);
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}
