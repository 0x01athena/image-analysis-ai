import React, { createContext, useState, useContext } from 'react';

const UploadContext = createContext();

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error('useUpload must be used within UploadProvider');
    }
    return context;
};

export const UploadProvider = ({ children }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    return (
        <UploadContext.Provider value={{ 
            isUploading, 
            setIsUploading, 
            isProcessing, 
            setIsProcessing 
        }}>
            {children}
        </UploadContext.Provider>
    );
};



