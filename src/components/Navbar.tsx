import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Key, LogOut } from 'lucide-react';
import { logoutUser } from '../api/auth'; // Adjust import path as needed

const Navbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const navItems = [
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/profile/dpop', label: 'DPoP Generator', icon: Key },
    ];

    return (
        <nav className="border-bottom border-dark border-2 bg-white">
            <div className="container py-3" style={{ maxWidth: "900px" }}>
                <div className="d-flex justify-content-between align-items-center">
                    {/* Brand/Logo */}
                    <div className="fw-bold text-black fs-4">DPoP Auth</div>

                    {/* Navigation Links */}
                    <div className="d-flex align-items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`btn rounded-0 d-flex align-items-center gap-2 ${isActive ? 'btn-dark' : 'btn-outline-dark'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="d-none d-md-inline">{item.label}</span>
                                </button>
                            );
                        })}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline-dark rounded-0 d-flex align-items-center gap-2"
                        >
                            <LogOut size={18} />
                            <span className="d-none d-md-inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;