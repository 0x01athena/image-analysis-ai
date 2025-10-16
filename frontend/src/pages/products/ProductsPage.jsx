import React, { useState } from 'react';
import ProductsViewPage from './ProductsViewPage';
import ProductDetailsPage from './ProductDetailsPage';

const ProductsPage = () => {
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'details'
    const [selectedProductId, setSelectedProductId] = useState(null);

    const handleViewProduct = (managementNumber) => {
        setSelectedProductId(managementNumber);
        setCurrentView('details');
    };

    const handleNavigateToDetails = (managementNumber) => {
        setSelectedProductId(managementNumber);
        setCurrentView('details');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedProductId(null);
    };

    const handleNextProduct = (managementNumber) => {
        setSelectedProductId(managementNumber);
        // Stay in details view, just change the product
    };

    const handlePreviousProduct = (managementNumber) => {
        setSelectedProductId(managementNumber);
        // Stay in details view, just change the product
    };

    if (currentView === 'details' && selectedProductId) {
        return (
            <ProductDetailsPage
                managementNumber={selectedProductId}
                onBack={handleBackToList}
                onNext={handleNextProduct}
                onPrevious={handlePreviousProduct}
            />
        );
    }

    return (
        <ProductsViewPage
            onViewProduct={handleViewProduct}
            onNavigateToDetails={handleNavigateToDetails}
        />
    );
};

export default ProductsPage;
