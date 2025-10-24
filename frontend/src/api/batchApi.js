import { API_BASE_URL } from './config.js';

/**
 * Upload images from directory
 * @param {FileList} files - Array of image files
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result
 */
export const uploadDirectoryImages = async (files, userId) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('images', file);
    });
    formData.append('userId', userId);

    const response = await fetch(`${API_BASE_URL}/batch/upload-directory`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Start batch processing for uploaded images
 * @param {string} workProcessId - Work Process ID from upload response
 * @returns {Promise<Object>} Processing start result
 */
export const startBatchProcessing = async (workProcessId) => {
    const response = await fetch(`${API_BASE_URL}/batch/start-processing`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workProcessId })
    });

    return response.json();
};

/**
 * Get all products with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Products list
 */
export const getAllProducts = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/batch/products?${queryString}`);

    if (!response.ok) {
        throw new Error(`Failed to get products: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get single product by management number
 * @param {string} managementNumber - Product management number
 * @returns {Promise<Object>} Product data
 */
export const getProduct = async (managementNumber) => {
    const response = await fetch(`${API_BASE_URL}/batch/products/${managementNumber}`);

    if (!response.ok) {
        throw new Error(`Failed to get product: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Update product
 * @param {string} managementNumber - Product management number
 * @param {Object} updateData - Product update data
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (managementNumber, updateData) => {
    const response = await fetch(`${API_BASE_URL}/batch/products/${managementNumber}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Delete product
 * @param {string} managementNumber - Product management number
 * @returns {Promise<Object>} Delete result
 */
export const deleteProduct = async (managementNumber) => {
    const response = await fetch(`${API_BASE_URL}/batch/products/${managementNumber}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get candidate titles for a product
 * @param {string} managementNumber - Product management number
 * @returns {Promise<Object>} Candidate titles
 */
export const getCandidateTitles = async (managementNumber) => {
    const response = await fetch(`${API_BASE_URL}/batch/products/${managementNumber}/candidate-titles`);

    if (!response.ok) {
        throw new Error(`Failed to get candidate titles: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Select a title from candidate titles
 * @param {string} managementNumber - Product management number
 * @param {string} selectedTitle - Selected title
 * @returns {Promise<Object>} Updated product
 */
export const selectTitle = async (managementNumber, selectedTitle) => {
    const response = await fetch(`${API_BASE_URL}/batch/products/${managementNumber}/select-title`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedTitle })
    });

    if (!response.ok) {
        throw new Error(`Failed to select title: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get all users
 * @returns {Promise<Object>} Users list
 */
export const getAllUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/batch/users`);

    if (!response.ok) {
        throw new Error(`Failed to get users: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get work process status by work process ID
 * @param {string} workProcessId - Work Process ID
 * @returns {Promise<Object>} Work process status
 */
export const getWorkProcessStatus = async (workProcessId) => {
    const response = await fetch(`${API_BASE_URL}/batch/work-process/${workProcessId}`);

    if (!response.ok) {
        if (response.status === 404) {
            return null; // Work process not found
        }
        throw new Error(`Failed to get work process status: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get active work processes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Active work processes
 */
export const getActiveWorkProcesses = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/batch/users/${userId}/work-processes`);

    if (!response.ok) {
        throw new Error(`Failed to get active work processes: ${response.statusText}`);
    }

    return response.json();
};

export const deleteMultipleProducts = async (managementNumbers) => {
    const response = await fetch(`${API_BASE_URL}/batch/products`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managementNumbers }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete products');
    }

    return response.json();
};
