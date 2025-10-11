import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, updateProduct, deleteProduct, getAllProducts } from '../../api/batchApi';

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

    const loadProduct = async () => {
        try {
            setLoading(true);
            const response = await getProduct(managementNumber);
            const productData = response.data;
            setProduct(productData);

            // Parse images from JSON string
            const productImages = JSON.parse(productData.images || '[]');
            console.log('Loaded product images:', productImages);
            setImages(productImages);

            // Initialize form data
            setFormData({
                title: productData.title || '',
                level: productData.level || '',
                measurement: productData.measurement || '',
                condition: productData.condition || '',
                category: productData.category || '',
                shop1: productData.shop1 || '',
                shop2: productData.shop2 || '',
                shop3: productData.shop3 || ''
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
            await updateProduct(managementNumber, formData);
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

            // Find next product with same date and rank
            const currentProduct = allProducts[currentIndex];
            if (!currentProduct) return;

            const sameDateAndRank = allProducts.filter(p =>
                new Date(p.createdAt).toDateString() === new Date(currentProduct.createdAt).toDateString() &&
                p.level === currentProduct.level
            );

            const currentInFiltered = sameDateAndRank.findIndex(p => p.managementNumber === managementNumber);
            const nextIndex = (currentInFiltered + 1) % sameDateAndRank.length;
            const nextProduct = sameDateAndRank[nextIndex];

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
                                <h1 className="text-2xl font-bold text-gray-900">商品詳細</h1>
                                <p className="text-gray-600">管理番号: {product.managementNumber}</p>
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
                                            className="w-full h-full object-contain"
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
                                                        className="w-full h-full object-cover rounded"
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
                        <div className="space-y-4">
                            {/* Generation Result */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    生成結果
                                </label>
                                <textarea
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="商品タイトル"
                                />
                            </div>

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
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="カテゴリ"
                                />
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
            </div>
        </div>
    );
};

export default ProductDetailsPage;