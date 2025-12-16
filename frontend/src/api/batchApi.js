import { API_BASE_URL } from './config.js';

/**
 * Upload images from directory
 * @param {FileList} files - Array of image files
 * @param {string} userId - User ID
 * @param {string} folderName - Optional folder name
 * @returns {Promise<Object>} Upload result
 */
export const uploadDirectoryImages = async (files, userId, folderName = null) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('images', file);
    });
    formData.append('userId', userId);
    if (folderName && folderName.trim()) {
        formData.append('folderName', folderName.trim());
    }

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
 * Mark work process as finished
 * @param {string} workProcessId - Work Process ID
 * @returns {Promise<Object>} Result
 */
export const markWorkProcessFinished = async (workProcessId) => {
    const response = await fetch(`${API_BASE_URL}/batch/work-process/${workProcessId}/finish`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to mark work process as finished: ${response.statusText}`);
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

/**
 * Get category list for a product
 * @param {string} productId - Product ID (management number)
 * @returns {Promise<Object>} Category list
 */
export const getProductCategoryList = async (productId) => {
    const response = await fetch(`${API_BASE_URL}/batch/products/${productId}/category-list`);

    if (!response.ok) {
        throw new Error(`Failed to get product category list: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get top-level categories
 * @returns {Promise<Object>} Top-level categories
 */
export const getTopLevelCategories = async () => {
    const response = await fetch(`${API_BASE_URL}/batch/categories/top-level`);

    if (!response.ok) {
        throw new Error(`Failed to get top-level categories: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get categories by level
 * @param {number} level - Category level (2-8)
 * @param {Object} parentCategories - Parent category selections
 * @param {string} productId - Product ID (management number)
 * @returns {Promise<Object>} Categories for the level
 */
export const getCategoriesByLevel = async (level, parentCategories = {}, productId) => {
    const requestBody = {
        ...parentCategories,
        ...(productId && { productId })
    };

    const response = await fetch(`${API_BASE_URL}/batch/categories/level/${level}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Failed to get categories: ${response.statusText}`);
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

/**
 * Export updated Excel file with 管理番号 and 色 columns updated
 * @param {Object} filters - Optional filter parameters (rank, date, worker, category, condition, search, folderId)
 * @returns {Promise<Object>} Export result
 */
export const exportExcelFile = async (filters = {}) => {
    try {
        const userId = JSON.parse(localStorage.getItem('selectedUser')).id;

        // Build query string with userId and filters
        const params = new URLSearchParams({ userId });
        if (filters.rank) params.append('rank', filters.rank);
        if (filters.date) params.append('date', filters.date);
        if (filters.worker) params.append('worker', filters.worker);
        if (filters.category) params.append('category', filters.category);
        if (filters.condition) params.append('condition', filters.condition);
        if (filters.search) params.append('search', filters.search);
        if (filters.folderId) params.append('folderId', filters.folderId);

        const response = await fetch(`${API_BASE_URL}/batch/excel/export?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.message || 'Export failed');
            error.managementNumber = errorData.managementNumber || null;
            throw error;
        }

        // Get the blob from response
        const blob = await response.blob();

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        // Generate filename with JST timestamp (fallback, actual filename comes from server)
        // Import dynamically to avoid circular dependencies
        const dateUtils = await import('../utils/dateUtils');
        const components = dateUtils.getJSTDateComponents();
        const timestamp = `${components.year}-${String(components.month).padStart(2, '0')}-${String(components.day).padStart(2, '0')}T${String(components.hour).padStart(2, '0')}-${String(components.minute).padStart(2, '0')}-${String(components.second).padStart(2, '0')}JST`;
        let filename = `products_export_${timestamp}.xlsx`;

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
                filename = decodeURIComponent(filename);
            }
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return { success: true };
    } catch (error) {
        console.error('Error exporting Excel file:', error);
        return {
            success: false,
            error: error.message,
            managementNumber: error.managementNumber || null
        };
    }
};

/**
 * Get all Excel export history
 * @returns {Promise<Object>} Export history
 */
export const getExportHistory = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/batch/excel/history`);

        if (!response.ok) {
            throw new Error('Failed to get export history');
        }

        return response.json();
    } catch (error) {
        console.error('Error getting export history:', error);
        throw error;
    }
};

/**
 * Get Excel export history by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Export history
 */
export const getExportHistoryByUser = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/batch/excel/history/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to get export history');
        }

        return response.json();
    } catch (error) {
        console.error('Error getting export history by user:', error);
        throw error;
    }
};

/**
 * Delete Excel export history
 * @param {string} id - Export history ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteExportHistory = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/batch/excel/history/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete export history');
        }

        return response.json();
    } catch (error) {
        console.error('Error deleting export history:', error);
        throw error;
    }
};

/**
 * Get all folders
 * @returns {Promise<Object>} Folders list
 */
export const getAllFolders = async () => {
    const response = await fetch(`${API_BASE_URL}/batch/folders`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to get folders: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get folders by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Folders list
 */
export const getFoldersByUser = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/batch/folders/user/${userId}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to get folders: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get folder by ID
 * @param {string} id - Folder ID
 * @returns {Promise<Object>} Folder data
 */
export const getFolderById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/batch/folders/${id}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to get folder: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Delete folder
 * @param {string} id - Folder ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteFolder = async (id) => {
    const response = await fetch(`${API_BASE_URL}/batch/folders/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete folder: ${response.statusText}`);
    }

    return response.json();
};