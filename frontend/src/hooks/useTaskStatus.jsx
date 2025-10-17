import { useState, useEffect, useRef } from 'react';
import { getProcessingStatus, getActiveSessions } from '../api/batchApi';

// Global polling manager to prevent multiple instances
class PollingManager {
    constructor() {
        this.activePolling = new Map();
        this.subscribers = new Map();
        this.currentSessionId = null;
    }

    static getInstance() {
        if (!PollingManager.instance) {
            PollingManager.instance = new PollingManager();
        }
        return PollingManager.instance;
    }

    subscribe(sessionId, callback) {
        if (!this.subscribers.has(sessionId)) {
            this.subscribers.set(sessionId, new Set());
        }
        this.subscribers.get(sessionId).add(callback);
    }

    unsubscribe(sessionId, callback) {
        const sessionSubscribers = this.subscribers.get(sessionId);
        if (sessionSubscribers) {
            sessionSubscribers.delete(callback);
            if (sessionSubscribers.size === 0) {
                this.subscribers.delete(sessionId);
                this.stopPolling(sessionId);
            }
        }
    }

    startPolling(sessionId, pollInterval = 2000) {
        // Stop any existing polling for this session
        this.stopPolling(sessionId);

        // Don't start if already polling this session
        if (this.activePolling.has(sessionId)) {
            return;
        }

        console.log(`Starting polling for session: ${sessionId}`);
        this.currentSessionId = sessionId;

        const interval = setInterval(async () => {
            try {
                const response = await getProcessingStatus(sessionId);

                if (response && response.success) {
                    const progressPercentage = response.data.totalProducts > 0
                        ? Math.round((response.data.processedProducts / response.data.totalProducts) * 100)
                        : 0;

                    // Check if upload is complete (uploadProgress >= 100 and not uploading)
                    const uploadComplete = response.data.uploadStatus &&
                        response.data.uploadStatus.uploadProgress >= 100 &&
                        !response.data.uploadStatus.isUploading;

                    // Check if AI analysis is complete
                    const analysisComplete = progressPercentage >= 100 || !response.data.isProcessing;

                    // Determine if all tasks are completed
                    // Only consider completed if both upload is done AND AI analysis is done
                    const isCompleted = uploadComplete && analysisComplete;

                    // Notify all subscribers
                    const sessionSubscribers = this.subscribers.get(sessionId);
                    if (sessionSubscribers) {
                        sessionSubscribers.forEach(callback => {
                            callback({
                                ...response.data,
                                progressPercentage,
                                isCompleted
                            });
                        });
                    }

                    // Stop polling if all tasks are completed
                    if (isCompleted) {
                        console.log(`All tasks completed (upload: ${response.data.uploadStatus?.uploadProgress}%, AI: ${progressPercentage}%), stopping polling`);
                        this.stopPolling(sessionId);
                    }
                } else {
                    // Session not found or expired
                    console.log('Session not found or expired, stopping polling');
                    this.stopPolling(sessionId);
                }
            } catch (err) {
                console.error('Error fetching task status:', err);
                this.stopPolling(sessionId);
            }
        }, pollInterval);

        this.activePolling.set(sessionId, interval);
    }

    stopPolling(sessionId) {
        const interval = this.activePolling.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.activePolling.delete(sessionId);
            console.log(`Stopped polling for session: ${sessionId}`);
        }

        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
        }
    }

    isPolling(sessionId) {
        return this.activePolling.has(sessionId);
    }

    getCurrentSessionId() {
        return this.currentSessionId;
    }
}

/**
 * Custom hook for managing task status polling
 * @param {string} sessionId - Session ID to monitor (optional)
 * @param {number} pollInterval - Polling interval in milliseconds (default: 2000)
 * @returns {Object} Task status and control functions
 */
export const useTaskStatus = (sessionId, pollInterval = 2000) => {
    const [taskStatus, setTaskStatus] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState(null);
    const pollingManager = PollingManager.getInstance();
    const callbackRef = useRef();

    // Create stable callback reference
    useEffect(() => {
        callbackRef.current = (data) => {
            if (data.isCompleted) {
                setTaskStatus(null);
                setIsPolling(false);
            } else {
                setTaskStatus(data);
                // Set polling state based on whether there's any active task (upload or AI analysis)
                // Keep polling active during the transition from upload to AI analysis
                const hasActiveUpload = data.uploadStatus && data.uploadStatus.isUploading;
                const hasActiveAnalysis = data.isProcessing;
                setIsPolling(hasActiveUpload || hasActiveAnalysis);
            }
            setError(null);
        };
    }, []);

    // Check for active sessions on initialization (one-time check)
    useEffect(() => {
        const checkActiveSessions = async () => {
            try {
                const response = await getActiveSessions();
                if (response.success && response.data.length > 0) {
                    const activeSession = response.data[0];
                    if (!sessionId) {
                        const hasActiveTask = activeSession.processingStatus.isProcessing ||
                            (activeSession.processingStatus.uploadStatus && activeSession.processingStatus.uploadStatus.isUploading);

                        if (hasActiveTask) {
                            // Check if AI analysis is complete
                            if (activeSession.processingStatus.isProcessing) {
                                const progressPercentage = activeSession.processingStatus.totalProducts > 0
                                    ? Math.round((activeSession.processingStatus.processedProducts / activeSession.processingStatus.totalProducts) * 100)
                                    : 0;

                                if (progressPercentage >= 100) {
                                    console.log('Found completed AI analysis session on page load, skipping polling');
                                    return;
                                }
                            }

                            setTaskStatus(activeSession.processingStatus);
                            startPolling(activeSession.sessionId);
                        }
                    }
                }
            } catch (err) {
                console.error('Error checking active sessions:', err);
            }
        };

        if (!sessionId) {
            checkActiveSessions();
        }
    }, []); // Run only once on mount

    // Start polling for task status
    const startPolling = (targetSessionId = sessionId) => {
        if (!targetSessionId) return;

        // Subscribe to polling updates
        if (callbackRef.current) {
            pollingManager.subscribe(targetSessionId, callbackRef.current);
        }

        // Start polling if not already polling
        if (!pollingManager.isPolling(targetSessionId)) {
            pollingManager.startPolling(targetSessionId, pollInterval);
        }

        setIsPolling(true);
        setError(null);
    };

    // Stop polling
    const stopPolling = () => {
        if (sessionId && callbackRef.current) {
            pollingManager.unsubscribe(sessionId, callbackRef.current);
        }
        setIsPolling(false);
    };

    // Fetch current status (one-time)
    const fetchStatus = async (targetSessionId = sessionId) => {
        try {
            const response = await getProcessingStatus(targetSessionId);

            if (response && response.success) {
                const progressPercentage = response.data.totalProducts > 0
                    ? Math.round((response.data.processedProducts / response.data.totalProducts) * 100)
                    : 0;

                if (progressPercentage >= 100 || !response.data.isProcessing) {
                    console.log(`Task completed (${progressPercentage}%), stopping polling`);
                    setTaskStatus(null);
                    stopPolling();
                    return;
                }

                setTaskStatus(response.data);
                setError(null);
            } else {
                console.log('Session not found or expired, clearing status');
                setTaskStatus(null);
                stopPolling();
            }
        } catch (err) {
            console.error('Error fetching task status:', err);
            setError(err.message);
            setTaskStatus(null);
            stopPolling();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    // Auto-start polling when sessionId changes and task is processing
    useEffect(() => {
        if (sessionId) {
            fetchStatus(sessionId).then(() => {
                if (taskStatus && taskStatus.isProcessing) {
                    const progressPercentage = taskStatus.totalProducts > 0
                        ? Math.round((taskStatus.processedProducts / taskStatus.totalProducts) * 100)
                        : 0;

                    if (progressPercentage < 100) {
                        startPolling(sessionId);
                    }
                }
            });
        } else {
            stopPolling();
            setTaskStatus(null);
        }
    }, [sessionId]);

    return {
        taskStatus,
        isPolling,
        error,
        startPolling,
        stopPolling,
        fetchStatus
    };
};