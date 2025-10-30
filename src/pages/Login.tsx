import React, { useState, useEffect } from "react";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { storage } from "../utils/storage";

const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    // Load saved preferences on mount
    useEffect(() => {
        const savedRememberMe = storage.getRememberMe();
        setRememberMe(savedRememberMe);

        if (savedRememberMe) {
            const savedUsername = storage.getRememberedUsername();
            const savedPassword = storage.getRememberedPassword();
            if (savedPassword) {
                setPassword(savedPassword);
            }
            if (savedUsername) {
                setUsername(savedUsername);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = await loginUser(username, password);

            if (token) {
                // Handle remember me preference
                if (rememberMe) {
                    storage.setRememberMe(true);
                    storage.setRememberedUsername(username);
                    storage.setRememberedPassword(password);
                } else {
                    storage.setRememberMe(false);
                    storage.clearRememberedUsername();
                }

                navigate("/profile");
            } else {
                throw new Error("Invalid login response");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-white d-flex align-items-center py-5">
            <div className="container" style={{ maxWidth: "900px" }}>
                {/* Header */}
                <div className="mb-5">
                    <h1 className="display-4 fw-bold text-black mb-2">Login</h1>
                    <p className="text-secondary fs-6">Enter your credentials to access your account</p>
                </div>

                {/* Form Section */}
                <div>
                    <div className="mb-4">
                        <label className="form-label fw-bold text-black small">Email or Username</label>
                        <input
                            type="text"
                            className="form-control form-control-lg border-dark border-2 rounded-0 shadow-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your email or username"
                            style={{ fontSize: "0.95rem" }}
                            autoComplete="username"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold text-black small">Password</label>
                        <input
                            type="password"
                            className="form-control form-control-lg border-dark border-2 rounded-0 shadow-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            style={{ fontSize: "0.95rem" }}
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="mb-4">
                        <div className="form-check">
                            <input
                                className="form-check-input border-dark border-2 rounded-0"
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ cursor: "pointer" }}
                            />
                            <label
                                className="form-check-label fw-semibold text-black small"
                                htmlFor="rememberMe"
                                style={{ cursor: "pointer" }}
                            >
                                Remember me
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="btn btn-dark btn-lg w-100 rounded-0 fw-bold mb-4"
                        disabled={loading}
                        style={{ padding: "0.75rem" }}
                    >
                        {loading ? "Logging in..." : "Login"}
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
                </div>
            </div>
        </div>
    );
};

export default Login;