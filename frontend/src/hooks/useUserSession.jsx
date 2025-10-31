import { useState, useEffect, useCallback } from 'react';
import { getAllUsers, getWorkProcessStatus, getActiveWorkProcesses } from '../api/batchApi';

const STORAGE_KEYS = {
    SELECTED_USER: 'selectedUser',
    CURRENT_SESSION: 'currentSession'
};

/**
 * Custom hook for managing user sessions and local storage
 */
export const useUserSession = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load users from API
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await getAllUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            console.error('Error loading users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load selected user from localStorage
    const loadSelectedUser = () => {
        try {
            const storedUser = localStorage.getItem(STORAGE_KEYS.SELECTED_USER);
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setSelectedUser(user);
            }
        } catch (err) {
            console.error('Error loading selected user from localStorage:', err);
        }
    };

    // Load current session from database (active work processes)
    const loadCurrentSession = useCallback(async () => {
        if (!selectedUser) {
            setCurrentSession(null);
            return;
        }

        try {
            const response = await getActiveWorkProcesses(selectedUser.id);
            if (response.success && response.data && response.data.length > 0) {
                // Get the most recent active work process (already sorted by createdAt desc)
                const mostRecentProcess = response.data[0];

                // Format it to match the expected session structure
                const session = {
                    workProcessId: mostRecentProcess.id,
                    userId: mostRecentProcess.userId,
                    startTime: mostRecentProcess.createdAt,
                    productCount: Array.isArray(mostRecentProcess.productIds)
                        ? mostRecentProcess.productIds.length
                        : 0
                };

                setCurrentSession(session);
            } else {
                // No active work processes found
                setCurrentSession(null);
            }
        } catch (err) {
            console.error('Error loading current session from database:', err);
            setCurrentSession(null);
        }
    }, [selectedUser]);

    // Save selected user to localStorage
    const saveSelectedUser = (user) => {
        try {
            localStorage.setItem(STORAGE_KEYS.SELECTED_USER, JSON.stringify(user));
            setSelectedUser(user);
        } catch (err) {
            console.error('Error saving selected user to localStorage:', err);
        }
    };

    // Save current session to localStorage
    const saveCurrentSession = (session) => {
        try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
            setCurrentSession(session);
        } catch (err) {
            console.error('Error saving current session to localStorage:', err);
        }
    };

    // Clear current session
    const clearCurrentSession = () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
            setCurrentSession(null);
        } catch (err) {
            console.error('Error clearing current session from localStorage:', err);
        }
    };

    // Check work process status
    const checkWorkProcessStatus = async (workProcessId) => {
        try {
            const response = await getWorkProcessStatus(workProcessId);
            return response;
        } catch (err) {
            console.error('Error checking work process status:', err);
            return null;
        }
    };

    // Get active work processes for current user
    const getActiveWorkProcessesForUser = async () => {
        if (!selectedUser) return [];

        try {
            const response = await getActiveWorkProcesses(selectedUser.id);
            if (response.success) {
                return response.data;
            }
            return [];
        } catch (err) {
            console.error('Error getting active work processes:', err);
            return [];
        }
    };

    // Initialize on mount
    useEffect(() => {
        loadUsers();
        loadSelectedUser();
    }, []);

    // Load current session from database when selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            loadCurrentSession();
        } else {
            setCurrentSession(null);
        }
    }, [selectedUser, loadCurrentSession]);

    return {
        users,
        selectedUser,
        currentSession,
        loading,
        error,
        loadUsers,
        saveSelectedUser,
        saveCurrentSession,
        clearCurrentSession,
        checkWorkProcessStatus,
        getActiveWorkProcessesForUser
    };
};
