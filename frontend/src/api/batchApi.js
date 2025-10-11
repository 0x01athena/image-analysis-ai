import { API_BASE_URL } from './config.js';

/**
 * Upload images from directory
 * @param {FileList} files - Array of image files
 * @returns {Promise<Object>} Upload result
 */
export const uploadDirectoryImages = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('images', file);
    });

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
 * @returns {Promise<Object>} Processing start result
 */
export const startBatchProcessing = async () => {
    const response = await fetch(`${API_BASE_URL}/batch/start-processing`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error(`Processing start failed: ${response.statusText}`);
    }

    return response.json();
};