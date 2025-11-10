import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, X, ChevronLeft, ChevronRight, FolderTree } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, updateProduct, deleteProduct, getAllProducts, selectTitle } from '../../api/batchApi';
import CategorySelectionModal from '../../components/CategorySelectionModal';

const ProductDetailsPage = () => {
    const { managementNumber } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [images, setImages] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [candidateTitles, setCandidateTitles] = useState([]);
    const [showTitleSelector, setShowTitleSelector] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const response = await getProduct(managementNumber);
            const productData = response.data;
            setProduct(productData);

            // Parse images from JSON string
            const productImages = JSON.parse(productData.images || '[]');
            setImages(productImages);

            // Parse candidate titles from JSON string
            const candidateTitlesData = JSON.parse(productData.candidateTitles || '[]');
            setCandidateTitles(candidateTitlesData);

            // Parse measurementType from JSON string
            const measurementTypeData = productData.measurementType ? JSON.parse(productData.measurementType) : { foreign: '', japanese: '' };

            // Initialize form data
            setFormData({
                title: productData.title || '',
                level: productData.level || '',
                measurement: productData.measurement || '',
                measurementType: measurementTypeData,
                condition: productData.condition || '',
                category: productData.category || '',
                shop1: productData.shop1 || '',
                shop2: productData.shop2 || '',
                shop3: productData.shop3 || '',
                price: productData.price || ''
            });
        } catch (error) {
            console.error('Error loading product:', error);
            alert('商品の読み込みに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadAllProducts = async () => {
        try {
            const response = await getAllProducts({ limit: 1000 });
            const products = response.data.products;
            setAllProducts(products);

            // Find current product index
            const index = products.findIndex(p => p.managementNumber === managementNumber);
            setCurrentIndex(index);
        } catch (error) {
            console.error('Error loading all products:', error);
        }
    };

    useEffect(() => {
        loadProduct();
        loadAllProducts();
    }, [managementNumber]);

    const handleSave = async () => {
        try {
            setSaving(true);
            // Prepare data with proper price formatting
            const saveData = {
                ...formData,
                price: formData.price && formData.price !== '' ? parseFloat(formData.price) : null,
                measurementType: formData.measurementType ? JSON.stringify(formData.measurementType) : null
            };
            await updateProduct(managementNumber, saveData);
            await loadProduct();
            alert('商品情報を保存しました');
        } catch (error) {
            console.error('Error saving product:', error);
            alert('保存に失敗しました: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('この商品を削除しますか？')) {
            try {
                await deleteProduct(managementNumber);
                alert('商品を削除しました');
                navigate('/products');
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('削除に失敗しました: ' + error.message);
            }
        }
    };

    const handleTabNavigation = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();

            // Find next product with same date (regardless of level)
            const currentProduct = allProducts[currentIndex];
            if (!currentProduct) return;

            const sameDate = allProducts.filter(p =>
                new Date(p.createdAt).toDateString() === new Date(currentProduct.createdAt).toDateString()
            );

            const currentInFiltered = sameDate.findIndex(p => p.managementNumber === managementNumber);
            const nextIndex = (currentInFiltered + 1) % sameDate.length;
            const nextProduct = sameDate[nextIndex];

            if (nextProduct && nextProduct.managementNumber !== managementNumber) {
                navigate(`/products/${nextProduct.managementNumber}`);
            }
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const selectImage = (index) => {
        setCurrentImageIndex(index);
    };

    const openImageModal = () => {
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
    };

    const handleTitleSelection = async (selectedTitle) => {
        try {
            await selectTitle(managementNumber, selectedTitle);
            setFormData(prev => ({ ...prev, title: selectedTitle }));
            setShowTitleSelector(false);
            alert('タイトルを選択しました');
        } catch (error) {
            console.error('Error selecting title:', error);
            alert('タイトルの選択に失敗しました: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">商品が見つかりません</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                    >
                        戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 py-8" onKeyDown={handleTabNavigation} tabIndex={0}>
            <div className="container mx-auto px-6 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-8 pb-10"
                >
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/products')}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-300"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">商品詳細</h1>
                                <div className="flex items-center gap-2">
                                    <p className="text-gray-600"><b>管理番号</b>: {product.managementNumber}</p>
                                    <p className="text-sm text-gray-500"><b>アップロード日時</b>: {new Date(product.createdAt).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? '保存中...' : '保存'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                削除
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">商品画像</h2>

                            {images.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Main Image Display */}
                                    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={`/public/images/${images[currentImageIndex]}`}
                                            alt={`Product ${currentImageIndex + 1}`}
                                            className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity duration-300"
                                            onClick={openImageModal}
                                            onError={(e) => {
                                                console.error('Image load error:', images[currentImageIndex]);
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className="hidden absolute inset-0 items-center justify-center text-gray-500">
                                            <span>画像を読み込めません</span>
                                        </div>

                                        {/* Navigation Arrows */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-300"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-300"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Image Counter */}
                                        {images.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                                {currentImageIndex + 1} / {images.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail Navigation */}
                                    {images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {images.map((image, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => selectImage(index)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded border-2 transition-all duration-300 ${index === currentImageIndex
                                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <img
                                                        src={`/public/images/${image}`}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        className="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity duration-300"
                                                        onClick={openImageModal}
                                                        onError={(e) => {
                                                            console.error('Thumbnail load error:', image);
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <div className="hidden w-full h-full items-center justify-center text-gray-400 text-xs">
                                                        <span>×</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <p className="text-gray-500">画像がありません</p>
                                </div>
                            )}
                        </div>

                        {/* Product Details Form */}
                        <div className="space-y-3">
                            {/* Generation Result */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        生成結果
                                    </label>
                                    {candidateTitles.length > 1 && (
                                        <button
                                            onClick={() => setShowTitleSelector(true)}
                                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300"
                                        >
                                            候補から選択
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="商品タイトル"
                                />
                                {/* Character Count Display */}
                                <div className="flex justify-between items-center mt-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium ${formData.title.length >= 65 ? 'text-red-600' : 'text-gray-500'}`}>
                                            {formData.title.length} 文字
                                        </span>
                                        {formData.title.length >= 65 && (
                                            <span className="text-xs text-red-600 font-medium">
                                                (65文字以上)
                                            </span>
                                        )}
                                    </div>
                                    {candidateTitles.length > 1 && (
                                        <p className="text-xs text-gray-500">
                                            AIが生成した{candidateTitles.length}個の候補があります
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Generation Rank */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        生成ランク
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.level}
                                        onChange={(e) => handleInputChange('level', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="A, B, C"
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        価格
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleInputChange('price', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="価格を入力"
                                            min="0"
                                            step="0.01"
                                        />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">円</span>
                                    </div>
                                </div>
                            </div>

                            {/* Measurements */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    採寸
                                </label>
                                <input
                                    type="text"
                                    value={formData.measurement}
                                    onChange={(e) => handleInputChange('measurement', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="着丈:65 肩幅:45 身幅:50 袖丈:20"
                                />
                            </div>

                            {/* Measurement Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    サイズ形式
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            海外サイズ
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.measurementType?.foreign || ''}
                                            onChange={(e) => handleInputChange('measurementType', { ...formData.measurementType, foreign: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="EUR 44"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            日本サイズ
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.measurementType?.japanese || ''}
                                            onChange={(e) => handleInputChange('measurementType', { ...formData.measurementType, japanese: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="日本サイズ28.5cm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    コンディション
                                </label>
                                <input
                                    type="text"
                                    value={formData.condition}
                                    onChange={(e) => handleInputChange('condition', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="1"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    カテゴリ
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="カテゴリコード"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryModal(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                                        title="カテゴリを選択"
                                    >
                                        <FolderTree className="w-4 h-4" />
                                        選択
                                    </button>
                                </div>
                            </div>

                            {/* Marketplace IDs */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        メルカリ
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.shop1}
                                        onChange={(e) => handleInputChange('shop1', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="87900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ヤフオク
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.shop2}
                                        onChange={(e) => handleInputChange('shop2', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="00081"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        楽天
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.shop3}
                                        onChange={(e) => handleInputChange('shop3', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="56238"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Title Selection Modal */}
                {showTitleSelector && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">AI生成タイトル候補</h3>
                                <button
                                    onClick={() => setShowTitleSelector(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {candidateTitles.map((title, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${title === formData.title
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleTitleSelection(title)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        候補{index + 1}
                                                    </span>
                                                    {title === formData.title && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            選択中
                                                        </span>
                                                    )}
                                                    {/* Character count for candidate title */}
                                                    <span className={`text-xs font-medium ${title.length >= 65 ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {title.length} 文字
                                                    </span>
                                                </div>
                                                <p className="text-gray-900 leading-relaxed">{title}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowTitleSelector(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Image Enlargement Modal */}
                {showImageModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeImageModal}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative max-w-[98vw] max-h-[98vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={closeImageModal}
                                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-300"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Main Image */}
                            <img
                                src={`/public/images/${images[currentImageIndex]}`}
                                alt={`Product ${currentImageIndex + 1}`}
                                className="max-w-[98vw] max-h-[98vh] object-contain"
                                onError={(e) => {
                                    console.error('Modal image load error:', images[currentImageIndex]);
                                    e.target.style.display = 'none';
                                }}
                            />

                            {/* Navigation Arrows for Modal */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            prevImage();
                                        }}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all duration-300"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            nextImage();
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all duration-300"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter for Modal */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Category Selection Modal */}
                <CategorySelectionModal
                    isOpen={showCategoryModal}
                    onClose={() => setShowCategoryModal(false)}
                    onSelect={(categoryCode) => {
                        handleInputChange('category', categoryCode);
                        setShowCategoryModal(false);
                    }}
                    currentCategory={formData.category}
                />
            </div>
        </div>
    );
};

export default ProductDetailsPage;