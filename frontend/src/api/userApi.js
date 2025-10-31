import { API_BASE_URL } from './config.js';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.username - Username
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
    }

    return response.json();
};

/**
 * Get all users
 * @returns {Promise<Object>} Users list
 */
export const getAllUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/users`);

    if (!response.ok) {
        throw new Error(`Failed to get users: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            return null; // User not found
        }
        throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} updateData - User update data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (id, updateData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
    }

    return response.json();
};

/**
 * Delete multiple users
 * @param {string[]} ids - Array of user IDs
 * @returns {Promise<Object>} Bulk delete result
 */
export const deleteMultipleUsers = async (ids) => {
    const response = await fetch(`${API_BASE_URL}/users/bulk-delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete users');
    }

    return response.json();
};
