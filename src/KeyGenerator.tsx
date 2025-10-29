// src/App.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";

interface JwkKey {
    kty: string;
    crv: string;
    x: string;
    y: string;
    ext: boolean;
    key_ops?: string[];
    alg?: string;
}

interface LoginResponse {
    accessToken: string;
    refreshToken?: string;
}

const API_BASE = "http://localhost:1337/bevcity-dev/api/v1";
const DB_NAME = "crypto-key-db";
const STORE_NAME = "keys";

const App: React.FC = () => {
    const [publicKeyJwk, setPublicKeyJwk] = useState<JwkKey | null>(null);
    const [username, setUsername] = useState("kolya+00007@hyperstacksinc.com");
    const [password, setPassword] = useState("z0zM4&Ph6@GL");
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    /* ---------------- Key generation / load ---------------- */
    useEffect(() => {
        (async () => {
            try {
                const existingKeys = await loadKeys();
                let keyPair = existingKeys;

                if (!keyPair) {
                    keyPair = await crypto.subtle.generateKey(
                        { name: "ECDSA", namedCurve: "P-256" },
                        true,
                        ["sign", "verify"]
                    );
                    await saveKeys(keyPair);
                }

                const exportedPub = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
                setPublicKeyJwk(exportedPub as JwkKey);
            } catch (err) {
                console.error("Key generation error:", err);
                setError("Failed to generate keys.");
            }
        })();
    }, []);

    /* ---------------- Handle Login ---------------- */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setStatusMsg(null);
        setLoading(true);

        try {
            const res = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
                loginIdentifier: username,
                password,
                publicKeyJwk, // Include public key for PoP binding
            });

            setAccessToken(res.data.accessToken);
            setStatusMsg("Login successful! Fetching profile...");
            await fetchProfile(res.data.accessToken);
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- Fetch Profile ---------------- */
    const fetchProfile = async (token: string) => {
        try {
            const keyPair = await loadKeys();
            if (!keyPair || !keyPair.privateKey) {
                throw new Error("No private key found for signing");
            }

            const method = "GET";
            const path = "/users/profile";
            const timestamp = Date.now().toString();
            const message = `${method}|${path}|${timestamp}`;
            const data = new TextEncoder().encode(message);

            // Sign message
            const signatureBuffer = await crypto.subtle.sign(
                { name: "ECDSA", hash: { name: "SHA-256" } },
                keyPair.privateKey,
                data
            );

            // ✅ Correct Base64 encoding (old code used TextDecoder incorrectly)
            const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

            // Fetch protected profile
            const res = await axios.get(`${API_BASE}${path}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Signature": signature,
                    "X-Timestamp": timestamp,
                },
            });

            setProfile(res.data);
            setStatusMsg("✅ Profile fetched successfully with PoP verification!");
        } catch (err: any) {
            console.error("Profile fetch error:", err);
            setError("Failed to fetch profile (PoP verification failed?).");
        }
    };

    /* ---------------- UI ---------------- */
    return (
        <div className="container mt-5" style={{ maxWidth: 480 }}>
            <div className="card shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-center mb-4">🔐 Secure Login</h3>

                    {!accessToken ? (
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">
                                    Username or Email
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    className="form-control"
                                    placeholder="Enter username or email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-control"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="d-grid">
                                <button
                                    className="btn btn-primary"
                                    type="submit"
                                    disabled={loading || !publicKeyJwk}
                                >
                                    {loading ? "Logging in..." : "Login"}
                                </button>
                            </div>

                            {error && (
                                <div className="alert alert-danger mt-3" role="alert">
                                    {error}
                                </div>
                            )}
                            {statusMsg && (
                                <div className="alert alert-info mt-3" role="alert">
                                    {statusMsg}
                                </div>
                            )}
                        </form>
                    ) : (
                        <div>
                            <div className="alert alert-success text-center">
                                Logged in successfully!
                            </div>

                            {profile ? (
                                <div>
                                    <h5>Your Profile:</h5>
                                    <pre className="bg-light p-3 rounded small">
                                        {JSON.stringify(profile, null, 2)}
                                    </pre>
                                    <button
                                        className="btn btn-secondary mt-3"
                                        onClick={() => {
                                            setAccessToken(null);
                                            setProfile(null);
                                            setStatusMsg(null);
                                            setError(null);
                                        }}
                                    >
                                        Log out
                                    </button>
                                </div>
                            ) : (
                                <p>Fetching your profile...</p>
                            )}
                        </div>
                    )}

                    {!publicKeyJwk && (
                        <p className="text-muted text-center small mt-3">
                            Generating secure key pair...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;

/* --------------- IndexedDB Helpers ---------------- */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveKeys = async (keyPair: CryptoKeyPair): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(keyPair, "keyPair");

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
};

const loadKeys = async (): Promise<CryptoKeyPair | null> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get("keyPair");

    return new Promise((resolve) => {
        request.onsuccess = () => {
            const result = request.result as CryptoKeyPair | undefined;
            db.close();
            resolve(result || null);
        };
        request.onerror = () => {
            db.close();
            resolve(null);
        };
    });
};
