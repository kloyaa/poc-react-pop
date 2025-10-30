import React, { useEffect, useState } from "react";
import { storage } from "../utils/storage";
import { logoutUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getPublicJwk } from "../crypto/keyUtils";
import { AlertCircle, Key, LogOut } from "lucide-react";

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [publicKey, setPublicKey] = useState<any>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate("/login");
    };

    const handleGenerateDPoP = () => {
        navigate("/profile/dpop");
    };

    useEffect(() => {
        (async () => {
            const token = storage.getToken();
            if (!token) return navigate("/login");
            try {
                const res = await api.get("/users/profile");
                const clientPublicKey = await getPublicJwk();
                setPublicKey(clientPublicKey);
                setProfile(res.data);
            } catch (error: any) {
                setErr(error?.response?.data?.message || "Failed to load profile");
                if (error?.response?.status === 401) {
                    logoutUser();
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    return (
        <div className="min-vh-100 bg-white py-5">
            <div className="container" style={{ maxWidth: "900px" }}>
                {/* Error Alert */}
                {err && (
                    <div className="alert border-dark border-2 rounded-0 bg-light mb-4" role="alert">
                        <div className="d-flex align-items-start">
                            <AlertCircle className="me-2 flex-shrink-0" size={20} />
                            <div className="fw-semibold small">{err}</div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-5">
                        <div className="fw-bold text-black">Loading profile data...</div>
                    </div>
                )}

                {/* Profile Data */}
                {!loading && profile && (
                    <div>
                        {/* Profile Section */}
                        <div className="border border-dark border-2 p-4 mb-4">
                            <h5 className="fw-bold mb-3">User Profile</h5>
                            <pre className="bg-light border border-secondary p-3 mb-0 small" style={{
                                overflowX: "auto",
                                fontFamily: "monospace"
                            }}>
                                {JSON.stringify(profile, null, 2)}
                            </pre>
                        </div>

                        {/* Public Key Section */}
                        <div className="border border-dark border-2 p-4">
                            <h5 className="fw-bold mb-3">Public Key</h5>
                            <pre className="bg-light border border-secondary p-3 mb-0 small" style={{
                                overflowX: "auto",
                                fontFamily: "monospace"
                            }}>
                                {JSON.stringify(publicKey, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
