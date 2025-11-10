import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { getTopLevelCategories, getCategoriesByLevel } from '../api/batchApi';

const CategorySelectionModal = ({ isOpen, onClose, onSelect, currentCategory }) => {
    const [step, setStep] = useState(1); // Step 1 = top level (7 buttons), Step 2+ = category2-8
    const [selectedPath, setSelectedPath] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load top-level categories when modal opens or when step returns to 1
    useEffect(() => {
        if (isOpen && step === 1) {
            loadTopLevelCategories();
        }
    }, [isOpen, step]);

    // Load categories for current step when step or selections change
    useEffect(() => {
        if (isOpen && step > 1) {
            loadCategoriesForStep();
        }
    }, [isOpen, step, selectedPath]);

    const loadTopLevelCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTopLevelCategories();
            if (response.success) {
                // Convert to format with hasChildren (we'll check this when user selects)
                setCategories(response.data.map(name => ({ name, hasChildren: true })));
            }
        } catch (err) {
            console.error('Error loading top-level categories:', err);
            setError('カテゴリの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const loadCategoriesForStep = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build parent categories object
            const parentCategories = {};
            if (selectedPath.category) parentCategories.category = selectedPath.category;
            if (selectedPath.category2) parentCategories.category2 = selectedPath.category2;
            if (selectedPath.category3) parentCategories.category3 = selectedPath.category3;
            if (selectedPath.category4) parentCategories.category4 = selectedPath.category4;
            if (selectedPath.category5) parentCategories.category5 = selectedPath.category5;
            if (selectedPath.category6) parentCategories.category6 = selectedPath.category6;
            if (selectedPath.category7) parentCategories.category7 = selectedPath.category7;

            const response = await getCategoriesByLevel(step, parentCategories);
            if (response.success) {
                setCategories(response.data);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
            setError('カテゴリの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (category) => {
        const levelKey = step === 1 ? 'category' : `category${step}`;
        const newPath = { ...selectedPath, [levelKey]: category.name };

        setSelectedPath(newPath);

        // If this category has no children and we're at level 3 or higher, it's final
        if (!category.hasChildren && step >= 3) {
            // Use the code from the category
            onSelect(category.code || '');
            handleClose();
        } else if (category.hasChildren) {
            // Move to next step
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            const newStep = step - 1;
            // Remove the last selection
            const levelKey = newStep === 1 ? 'category' : `category${newStep}`;
            const newPath = { ...selectedPath };
            delete newPath[levelKey];
            // Also remove any deeper levels
            for (let i = step; i <= 8; i++) {
                delete newPath[`category${i}`];
            }
            setSelectedPath(newPath);
            setStep(newStep);
            // If going back to step 1, reload top-level categories
            if (newStep === 1) {
                loadTopLevelCategories();
            }
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedPath({});
        setCategories([]);
        setError(null);
        onClose();
    };

    const getBreadcrumb = () => {
        const path = [];
        if (selectedPath.category) path.push(selectedPath.category);
        if (selectedPath.category2) path.push(selectedPath.category2);
        if (selectedPath.category3) path.push(selectedPath.category3);
        if (selectedPath.category4) path.push(selectedPath.category4);
        if (selectedPath.category5) path.push(selectedPath.category5);
        if (selectedPath.category6) path.push(selectedPath.category6);
        if (selectedPath.category7) path.push(selectedPath.category7);
        return path;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">カテゴリ選択</h2>
                        {getBreadcrumb().length > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                {getBreadcrumb().map((item, index) => (
                                    <React.Fragment key={index}>
                                        <span>{item}</span>
                                        {index < getBreadcrumb().length - 1 && (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">読み込み中...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">{error}</div>
                    ) : (
                        <div className={step === 1
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                        }>
                            {categories.map((category, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleCategorySelect(category)}
                                    className={`border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left ${step === 1 ? 'p-6' : 'p-4'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`font-medium text-gray-900 ${step === 1 ? 'text-lg' : ''}`}>
                                            {category.name}
                                        </span>
                                        {category.hasChildren && (
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        )}
                                        {!category.hasChildren && category.code && (
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                コード: {category.code}
                                            </span>
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 ${step === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        戻る
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-400 transition-colors duration-300"
                    >
                        キャンセル
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default CategorySelectionModal;

