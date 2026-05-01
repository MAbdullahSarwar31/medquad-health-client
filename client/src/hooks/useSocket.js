import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
    : 'http://localhost:5000';

let socketInstance = null;

export const useSocket = () => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
                setSocket(null);
            }
            return;
        }

        if (!socketInstance) {
            socketInstance = io(SOCKET_URL, {
                withCredentials: true,
                autoConnect: true
            });

            socketInstance.on('connect', () => {
                console.log('Connected to real-time updates');
                
                // Join appropriate rooms based on role
                if (user.role === 'admin') {
                    socketInstance.emit('joinRoom', 'room:admin');
                } else if (user.role === 'client' && user.clientId) {
                    socketInstance.emit('joinRoom', `room:${user.clientId}`);
                } else if (user.role === 'employee') {
                    socketInstance.emit('joinRoom', `room:${user._id}`);
                }
            });

            setSocket(socketInstance);
        } else {
            setSocket(socketInstance);
        }

        return () => {
            // Keep socket alive across unmounts until logout, 
            // but we can clean up if we want. In this pattern, 
            // we keep it alive as a singleton.
        };
    }, [user, isAuthenticated]);

    return socket;
};
