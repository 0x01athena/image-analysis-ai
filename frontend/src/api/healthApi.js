import { BACKEND_URL } from './config.js';

/**
 * Get server health status
 * @returns {Promise<Object>} Health status
 */
export const getHealthStatus = async () => {
    const response = await fetch(`${BACKEND_URL}/health`);

    if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
};
