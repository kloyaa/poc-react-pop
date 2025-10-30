import React, { useEffect, useState } from "react";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { getPublicJwk } from "../crypto/keyUtils";
import { getOrCreateDPoPKeyPair } from "../crypto/dpop";
import { storage } from "../utils/storage";

interface CopiedState {
    key: boolean;
    proof: boolean;
}

const DPoPGenerator: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState<string>("http://localhost:1337/bevcity-dev");
    const [path, setPath] = useState<string>("/api/v1/auth/login");
    const [persistBaseUrl, setPersistBaseUrl] = useState<boolean>(false);
    const [method, setMethod] = useState<string>("GET");
    const [publicKey, setPublicKey] = useState<any>(null);
    const [proof, setProof] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [copied, setCopied] = useState<CopiedState>({ key: false, proof: false });

    // Load persisted base URL on mount
    useEffect(() => {
        const savedBaseUrl = storage.getPersistedBaseUrl();
        const shouldPersist = storage.getShouldPersistBaseUrl();

        if (shouldPersist && savedBaseUrl) {
            setBaseUrl(savedBaseUrl);
            setPersistBaseUrl(true);
        }
    }, []);

    // Handle persist checkbox change
    const handlePersistChange = (checked: boolean) => {
        setPersistBaseUrl(checked);

        if (checked) {
            storage.setPersistedBaseUrl(baseUrl);
            storage.setShouldPersistBaseUrl(true);
        } else {
            storage.clearPersistedBaseUrl();
            storage.setShouldPersistBaseUrl(false);
        }
    };

    // Update persisted base URL when it changes
    useEffect(() => {
        if (persistBaseUrl) {
            storage.setPersistedBaseUrl(baseUrl);
        }
    }, [baseUrl, persistBaseUrl]);

    // Compute full URL
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;

    async function generateDPoP() {
        setError(null);
        setLoading(true);
        try {
            const keyPair = await getOrCreateDPoPKeyPair();
            const clientPublicKey = await getPublicJwk();

            const jti = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);

            const header = {
                alg: "ES256",
                typ: "dpop+jwt",
                jwk: clientPublicKey
            };

            const payload = {
                htm: method.toUpperCase(),
                htu: fullUrl,
                jti,
                iat: now,
            };

            const enc = (obj: any) =>
                btoa(JSON.stringify(obj))
                    .replace(/\+/g, "-")
                    .replace(/\//g, "_")
                    .replace(/=+$/, "");

            const headerB64 = enc(header);
            const payloadB64 = enc(payload);
            const toSign = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

            const signature = await crypto.subtle.sign(
                { name: "ECDSA", hash: "SHA-256" },
                keyPair.privateKey,
                toSign
            );

            const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            setProof(`${headerB64}.${payloadB64}.${signatureB64}`);
            setPublicKey(clientPublicKey);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to generate DPoP proof");
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = async (text: string, type: keyof CopiedState) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied({ ...copied, [type]: true });
            setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="min-vh-100 bg-white py-5">
            <div className="container" style={{ maxWidth: "900px" }}>
                {/* Base URL Section */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold text-black small mb-0">Base URL</label>
                        <div className="form-check">
                            <input
                                className="form-check-input border-dark border-2 rounded-0"
                                type="checkbox"
                                id="persistBaseUrl"
                                checked={persistBaseUrl}
                                onChange={(e) => handlePersistChange(e.target.checked)}
                                style={{ cursor: "pointer" }}
                            />
                            <label
                                className="form-check-label fw-semibold text-black small"
                                htmlFor="persistBaseUrl"
                                style={{ cursor: "pointer" }}
                            >
                                Persist
                            </label>
                        </div>
                    </div>
                    <input
                        type="text"
                        className="form-control form-control-lg border-dark border-2 rounded-0 shadow-none"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:1337/bevcity-dev"
                        style={{ fontSize: "0.95rem" }}
                    />
                </div>

                {/* Path Section */}
                <div className="mb-4">
                    <label className="form-label fw-bold text-black small">Path</label>
                    <input
                        type="text"
                        className="form-control form-control-lg border-dark border-2 rounded-0 shadow-none"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="/api/v1/auth/login"
                        style={{ fontSize: "0.95rem" }}
                    />
                </div>

                {/* Full URL Preview */}
                <div className="mb-4">
                    <label className="form-label fw-bold text-black small">Full URL</label>
                    <div className="border border-secondary p-3 bg-light">
                        <code className="text-black small">{fullUrl}</code>
                    </div>
                </div>

                {/* HTTP Method Section */}
                <div className="mb-4">
                    <label className="form-label fw-bold text-black small">HTTP Method</label>
                    <select
                        className="form-select form-select-lg border-dark border-2 rounded-0 shadow-none"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        style={{ fontSize: "0.95rem" }}
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>

                <button
                    className="btn btn-dark btn-lg w-100 rounded-0 fw-bold mb-4"
                    onClick={generateDPoP}
                    disabled={loading}
                    style={{ padding: "0.75rem" }}
                >
                    {loading ? "Generating..." : "Generate DPoP Proof"}
                </button>

                {/* Error Alert */}
                {error && (
                    <div className="alert border-dark border-2 rounded-0 bg-light mb-4" role="alert">
                        <div className="d-flex align-items-start">
                            <AlertCircle className="me-2 flex-shrink-0" size={20} />
                            <div className="fw-semibold small">{error}</div>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {proof && (
                    <div className="mt-5">
                        {/* Public Key */}
                        <div className="border border-dark border-2 p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">DPoP Public Key</h5>
                                <button
                                    onClick={() => copyToClipboard(JSON.stringify(publicKey, null, 2), "key")}
                                    className="btn btn-outline-dark btn-sm rounded-0 d-flex align-items-center gap-2"
                                >
                                    {copied.key ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="bg-light border border-secondary p-3 mb-0 small" style={{
                                overflowX: "auto",
                                fontFamily: "monospace"
                            }}>
                                {JSON.stringify(publicKey, null, 2)}
                            </pre>
                        </div>

                        {/* JWT Proof */}
                        <div className="border border-dark border-2 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">DPoP JWT Proof</h5>
                                <button
                                    onClick={() => copyToClipboard(proof, "proof")}
                                    className="btn btn-outline-dark btn-sm rounded-0 d-flex align-items-center gap-2"
                                >
                                    {copied.proof ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="bg-light border border-secondary p-3 mb-0 small" style={{
                                overflowX: "auto",
                                wordBreak: "break-all",
                                whiteSpace: "pre-wrap",
                                fontFamily: "monospace"
                            }}>
                                {proof}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DPoPGenerator;