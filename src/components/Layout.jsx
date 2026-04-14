import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdDashboard, MdBuild, MdPeople, MdInventory,
    MdConfirmationNumber, MdBusiness, MdLogout,
    MdMenu, MdClose, MdNotifications, MdPerson,
    MdKeyboardArrowDown, MdKeyboardArrowRight, MdAttachMoney, MdReceipt
} from 'react-icons/md';
import './Layout.css';

/* ── Nav link definitions per role ── */
const ADMIN_LINKS = [
    { to: '/admin', icon: <MdDashboard />, label: 'Overview', end: true },
    { to: '/admin/tickets', icon: <MdConfirmationNumber />, label: 'Service Tickets' },
    { to: '/admin/equipment', icon: <MdBuild />, label: 'Equipment' },
    { to: '/admin/clients', icon: <MdBusiness />, label: 'Clients' },
    { to: '/admin/users', icon: <MdPeople />, label: 'Users' },
    { to: '/admin/inventory', icon: <MdInventory />, label: 'Inventory' },
    { to: '/admin/expenses', icon: <MdAttachMoney />, label: 'Expense Claims' },
    { to: '/admin/invoices', icon: <MdReceipt />, label: 'Invoices' },
];

const EMPLOYEE_LINKS = [
    { to: '/employee', icon: <MdDashboard />, label: 'My Dashboard', end: true },
    { to: '/employee/tickets', icon: <MdConfirmationNumber />, label: 'My Tickets' },
    { to: '/employee/inventory', icon: <MdInventory />, label: 'Inventory' },
    { to: '/employee/expenses', icon: <MdAttachMoney />, label: 'My Expenses' },
];

const CLIENT_LINKS = [
    { to: '/client', icon: <MdDashboard />, label: 'My Dashboard', end: true },
    { to: '/client/equipment', icon: <MdBuild />, label: 'My Equipment' },
    { to: '/client/tickets', icon: <MdConfirmationNumber />, label: 'My Tickets' },
    { to: '/client/invoices', icon: <MdReceipt />, label: 'My Bills / Invoices' },
];

function getLinks(role) {
    if (role === 'admin') return ADMIN_LINKS;
    if (role === 'employee') return EMPLOYEE_LINKS;
    if (role === 'client') return CLIENT_LINKS;
    return [];
}

function getRoleLabel(role) {
    const map = { admin: 'Administrator', employee: 'Employee', client: 'Client' };
    return map[role] || role;
}

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const links = getLinks(user?.role);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            {/* ── Mobile Overlay ── */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ══════════════════════════════
          SIDEBAR
      ══════════════════════════════ */}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-card">
                        <img src="/logo.png" alt="Medquad Health Solutions" className="sidebar-logo-img" />
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <MdClose />
                    </button>
                </div>

                {/* Role badge */}
                <div className="sidebar-role">
                    <span className="sidebar-role-badge">
                        {getRoleLabel(user?.role)}
                    </span>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <p className="sidebar-nav-label">Main Menu</p>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            <span className="sidebar-link-label">{link.label}</span>
                            <MdKeyboardArrowRight className="sidebar-link-arrow" />
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="sidebar-footer">
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <MdLogout />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ══════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════ */}
            <div className="layout-main">
                {/* ── TOPBAR ── */}
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            className="topbar-menu-btn"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <MdMenu />
                        </button>
                        <div className="topbar-breadcrumb">
                            <span className="topbar-brand">Medquad</span>
                            <span className="topbar-divider">/</span>
                            <span className="topbar-page">Portal</span>
                        </div>
                    </div>

                    <div className="topbar-right">
                        {/* Notifications */}
                        <button className="topbar-icon-btn">
                            <MdNotifications />
                            <span className="topbar-notif-dot" />
                        </button>

                        {/* User menu */}
                        <div className="topbar-user">
                            <button
                                className="topbar-user-btn"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="topbar-avatar">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="topbar-user-info">
                                    <span className="topbar-user-name">{user?.name}</span>
                                    <span className="topbar-user-role">{getRoleLabel(user?.role)}</span>
                                </div>
                                <MdKeyboardArrowDown className={`topbar-user-caret ${userMenuOpen ? 'open' : ''}`} />
                            </button>

                            {userMenuOpen && (
                                <div className="topbar-dropdown">
                                    <div className="topbar-dropdown-header">
                                        <strong>{user?.name}</strong>
                                        <span>{user?.email}</span>
                                    </div>
                                    <hr className="topbar-dropdown-divider" />
                                    <button
                                        className="topbar-dropdown-item topbar-dropdown-item--danger"
                                        onClick={handleLogout}
                                    >
                                        <MdLogout /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── PAGE CONTENT ── */}
                <main className="layout-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
