import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FiBell, FiCheckCircle, FiTrash2, FiFilter,
    FiAlertTriangle, FiXCircle, FiTool, FiPackage, FiCpu, FiFileText
} from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';
import './NotificationsPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://medquad-health-solutions-api.onrender.com/api/v1';

const TYPE_CONFIG = {
    ticket_created:    { icon: <FiFileText />,      color: '#3b82f6', label: 'New Ticket' },
    ticket_assigned:   { icon: <FiTool />,           color: '#8b5cf6', label: 'Assignment' },
    ticket_updated:    { icon: <FiFileText />,       color: '#6366f1', label: 'Ticket Update' },
    ticket_resolved:   { icon: <FiCheckCircle />,   color: '#10b981', label: 'Resolved' },
    expense_submitted: { icon: <FiFileText />,       color: '#f59e0b', label: 'Expense' },
    expense_approved:  { icon: <FiCheckCircle />,   color: '#10b981', label: 'Approved' },
    expense_rejected:  { icon: <FiXCircle />,        color: '#ef4444', label: 'Rejected' },
    equipment_down:    { icon: <FiAlertTriangle />, color: '#ef4444', label: 'Equipment' },
    equipment_added:   { icon: <FiTool />,           color: '#06b6d4', label: 'Equipment' },
    inventory_low:     { icon: <FiPackage />,        color: '#f59e0b', label: 'Inventory' },
    ai_critical_alert: { icon: <FiCpu />,            color: '#ef4444', label: 'AI Alert' },
    general:           { icon: <FiBell />,           color: '#64748b', label: 'General' },
};

const FILTER_TABS = [
    { key: 'all',      label: 'All' },
    { key: 'unread',   label: 'Unread' },
    { key: 'tickets',  label: 'Tickets',   types: ['ticket_created','ticket_assigned','ticket_updated','ticket_resolved'] },
    { key: 'expenses', label: 'Expenses',  types: ['expense_submitted','expense_approved','expense_rejected'] },
    { key: 'alerts',   label: 'AI Alerts', types: ['ai_critical_alert','equipment_down','inventory_low'] },
];

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return new Date(date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [activeTab, setActiveTab]         = useState('all');
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [totalCount, setTotalCount]       = useState(0);
    const [selected, setSelected]           = useState(new Set());
    const navigate                          = useNavigate();

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const tab = FILTER_TABS.find((t) => t.key === activeTab);
            const params = new URLSearchParams({ page, limit: 15 });
            if (activeTab === 'unread') params.set('isRead', 'false');
            if (tab?.types) params.set('type', tab.types.join(','));

            const { data } = await axios.get(`${API_BASE}/notifications?${params}`, authHeaders);
            setNotifications(data.data.notifications);
            setTotalPages(data.data.pagination.pages);
            setTotalCount(data.data.pagination.total);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [activeTab, page, token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkRead = async (id) => {
        try {
            await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, authHeaders);
            setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch(`${API_BASE}/notifications/read-all`, {}, authHeaders);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch { /* silent */ }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_BASE}/notifications/${id}`, authHeaders);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
        } catch { /* silent */ }
    };

    const handleDeleteSelected = async () => {
        await Promise.allSettled([...selected].map((id) => axios.delete(`${API_BASE}/notifications/${id}`, authHeaders)));
        setNotifications((prev) => prev.filter((n) => !selected.has(n._id)));
        setSelected(new Set());
    };

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    return (
        <div className="np-wrapper">
            {/* Page Header — matches all other portal pages */}
            <div className="page-header-row">
                <div className="page-header">
                    <h1 className="page-header-title">
                        Notification <span>Center</span>
                    </h1>
                    <p className="page-header-sub">{totalCount} total notifications across all modules</p>
                </div>
                <div className="np-header-actions">
                    {selected.size > 0 && (
                        <button className="np-btn-danger" onClick={handleDeleteSelected}>
                            <FiTrash2 /> Delete {selected.size} selected
                        </button>
                    )}
                    <button className="np-btn-secondary" onClick={handleMarkAllRead}>
                        <MdDoneAll /> Mark all read
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="np-tabs">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`np-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab.key); setPage(1); }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="np-list">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="np-skeleton" />
                    ))
                ) : notifications.length === 0 ? (
                    <div className="np-empty">
                        <FiBell size={48} />
                        <h3>No notifications here</h3>
                        <p>You're all caught up! Check back later.</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
                        const isSelected = selected.has(notif._id);
                        return (
                            <div
                                key={notif._id}
                                className={`np-item ${notif.isRead ? '' : 'unread'} ${isSelected ? 'selected' : ''}`}
                            >
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    className="np-checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelect(notif._id)}
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Icon */}
                                <div
                                    className="np-item-icon"
                                    style={{ color: config.color, background: `${config.color}18` }}
                                >
                                    {config.icon}
                                </div>

                                {/* Content */}
                                <div
                                    className="np-item-content"
                                    onClick={() => {
                                        if (!notif.isRead) handleMarkRead(notif._id);
                                        navigate(notif.link || '/');
                                    }}
                                >
                                    <div className="np-item-top">
                                        <span
                                            className="np-item-badge"
                                            style={{ background: `${config.color}18`, color: config.color }}
                                        >
                                            {config.label}
                                        </span>
                                        <span className="np-item-time">{timeAgo(notif.createdAt)}</span>
                                    </div>
                                    <h4 className="np-item-title">{notif.title}</h4>
                                    <p className="np-item-msg">{notif.message}</p>
                                </div>

                                {/* Actions */}
                                <div className="np-item-actions">
                                    {!notif.isRead && (
                                        <button
                                            className="np-action-btn read"
                                            onClick={() => handleMarkRead(notif._id)}
                                            title="Mark as read"
                                        >
                                            <FiCheckCircle />
                                        </button>
                                    )}
                                    <button
                                        className="np-action-btn delete"
                                        onClick={() => handleDelete(notif._id)}
                                        title="Delete"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>

                                {!notif.isRead && <div className="np-unread-indicator" />}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="np-pagination">
                    <button
                        className="np-page-btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Previous
                    </button>
                    <span className="np-page-info">Page {page} of {totalPages}</span>
                    <button
                        className="np-page-btn"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
