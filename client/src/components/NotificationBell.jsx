import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdDone, MdDoneAll, MdClose, MdOpenInNew } from 'react-icons/md';
import {
    FiAlertTriangle, FiCheckCircle, FiXCircle, FiTool,
    FiPackage, FiCpu, FiFileText, FiBell
} from 'react-icons/fi';
import axios from 'axios';
import { io } from 'socket.io-client';
import './NotificationBell.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const TYPE_CONFIG = {
    ticket_created:   { icon: <FiFileText />,      color: '#3b82f6', label: 'New Ticket' },
    ticket_assigned:  { icon: <FiTool />,           color: '#8b5cf6', label: 'Ticket Assigned' },
    ticket_updated:   { icon: <FiFileText />,      color: '#6366f1', label: 'Ticket Update' },
    ticket_resolved:  { icon: <FiCheckCircle />,   color: '#10b981', label: 'Ticket Resolved' },
    expense_submitted:{ icon: <FiFileText />,      color: '#f59e0b', label: 'Expense Submitted' },
    expense_approved: { icon: <FiCheckCircle />,   color: '#10b981', label: 'Expense Approved' },
    expense_rejected: { icon: <FiXCircle />,        color: '#ef4444', label: 'Expense Rejected' },
    equipment_down:   { icon: <FiAlertTriangle />, color: '#ef4444', label: 'Equipment Down' },
    equipment_added:  { icon: <FiTool />,           color: '#06b6d4', label: 'Equipment Added' },
    inventory_low:    { icon: <FiPackage />,        color: '#f59e0b', label: 'Low Stock' },
    ai_critical_alert:{ icon: <FiCpu />,            color: '#ef4444', label: 'AI Alert' },
    general:          { icon: <FiBell />,           color: '#64748b', label: 'Notification' },
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

export default function NotificationBell({ user }) {
    const [open, setOpen]             = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading]       = useState(false);
    const dropdownRef                 = useRef(null);
    const socketRef                   = useRef(null);
    const navigate                    = useNavigate();

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch unread count (for badge)
    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/notifications/unread-count`, authHeaders);
            setUnreadCount(data.data.count);
        } catch { /* silent */ }
    }, [token]);

    // Fetch notifications for dropdown
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/notifications?limit=10`, authHeaders);
            setNotifications(data.data.notifications);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [token]);

    // Connect Socket.IO for real-time updates
    useEffect(() => {
        if (!user?._id) return;
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('joinUserRoom', user._id);
        });

        socket.on('newNotification', (notification) => {
            // Prepend new notification and increment badge
            setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
            setUnreadCount((prev) => prev + 1);
            // Subtle sound
            try { new Audio('/notification.mp3').play(); } catch { /* ignore */ }
        });

        return () => socket.disconnect();
    }, [user?._id]);

    // Initial fetch
    useEffect(() => {
        if (user?._id) {
            fetchUnreadCount();
        }
    }, [user?._id, fetchUnreadCount]);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, authHeaders);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch(`${API_BASE}/notifications/read-all`, {}, authHeaders);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleNotifClick = (notif) => {
        if (!notif.isRead) handleMarkRead(notif._id);
        setOpen(false);
        navigate(notif.link || '/');
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await axios.delete(`${API_BASE}/notifications/${id}`, authHeaders);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch { /* silent */ }
    };

    return (
        <div className="notif-bell-wrapper" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                className={`notif-bell-btn ${open ? 'active' : ''}`}
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifications"
                aria-expanded={open}
            >
                <MdNotifications className="notif-bell-icon" />
                {unreadCount > 0 && (
                    <span className="notif-badge" aria-label={`${unreadCount} unread`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="notif-dropdown" role="dialog" aria-label="Notifications panel">
                    {/* Header */}
                    <div className="notif-dropdown-header">
                        <div>
                            <h3 className="notif-dropdown-title">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="notif-unread-label">{unreadCount} unread</span>
                            )}
                        </div>
                        <button
                            className="notif-mark-all-btn"
                            onClick={handleMarkAllRead}
                            title="Mark all as read"
                        >
                            <MdDoneAll /> Mark all read
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="notif-list">
                        {loading ? (
                            <div className="notif-empty">
                                <div className="notif-spinner" />
                                <p>Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notif-empty">
                                <FiBell size={32} />
                                <p>You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
                                return (
                                    <div
                                        key={notif._id}
                                        className={`notif-item ${notif.isRead ? '' : 'unread'}`}
                                        onClick={() => handleNotifClick(notif)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleNotifClick(notif)}
                                    >
                                        <div
                                            className="notif-item-icon"
                                            style={{ color: config.color, background: `${config.color}18` }}
                                        >
                                            {config.icon}
                                        </div>
                                        <div className="notif-item-content">
                                            <p className="notif-item-title">{notif.title}</p>
                                            <p className="notif-item-msg">{notif.message}</p>
                                            <span className="notif-item-time">{timeAgo(notif.createdAt)}</span>
                                        </div>
                                        <div className="notif-item-actions">
                                            {!notif.isRead && (
                                                <button
                                                    className="notif-read-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleMarkRead(notif._id); }}
                                                    title="Mark as read"
                                                >
                                                    <MdDone />
                                                </button>
                                            )}
                                            <button
                                                className="notif-delete-btn"
                                                onClick={(e) => handleDelete(e, notif._id)}
                                                title="Delete"
                                            >
                                                <MdClose />
                                            </button>
                                        </div>
                                        {!notif.isRead && <div className="notif-unread-dot" />}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="notif-dropdown-footer">
                        <button
                            className="notif-view-all-btn"
                            onClick={() => { setOpen(false); navigate('/notifications'); }}
                        >
                            <MdOpenInNew /> View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
