import React, { useState } from "react";
import { registerUser, loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
    const [form, setForm] = useState({ email: "", username: "", password: "", phoneNumber: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErr(null);
        try {
            await registerUser(form);
            await loginUser(form.username, form.password);
            navigate("/profile");
        } catch (error: any) {
            setErr(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 480 }}>
            <h3 className="text-center">Register</h3>
            <form onSubmit={handleSubmit}>
                <input className="form-control mb-2" placeholder="Email" value={form.email} onChange={e => handleChange("email", e.target.value)} />
                <input className="form-control mb-2" placeholder="Username" value={form.username} onChange={e => handleChange("username", e.target.value)} />
                <input className="form-control mb-2" type="password" placeholder="Password" value={form.password} onChange={e => handleChange("password", e.target.value)} />
                <input className="form-control mb-3" placeholder="Phone" value={form.phoneNumber} onChange={e => handleChange("phoneNumber", e.target.value)} />
                <button className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
                {err && <div className="alert alert-danger mt-3">{err}</div>}
            </form>
        </div>
    );
};

export default Register;
