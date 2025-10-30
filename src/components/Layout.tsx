import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register'];
    const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

    return (
        <div className="min-vh-100 bg-white">
            {!shouldHideNavbar && <Navbar />}
            {children}
        </div>
    );
};

export default Layout;
