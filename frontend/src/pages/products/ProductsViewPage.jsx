import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { getAllProducts, deleteProduct } from '../../api/batchApi';

const ProductsViewPage = ({ onViewProduct, onNavigateToDetails }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        rank: '',
        date: '',
        search: ''
    });

    const loadProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 50,
                ...(filters.rank && { rank: filters.rank }),
                ...(filters.date && { date: filters.date })
            };

            const response = await getAllProducts(params);
            setProducts(response.data.products);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error loading products:', error);
            alert('商品の読み込みに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [currentPage, filters.rank, filters.date]);

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedProducts(new Set(products.map(p => p.managementNumber)));
        } else {
            setSelectedProducts(new Set());
        }
    };

    const handleSelectProduct = (managementNumber, checked) => {
        const newSelected = new Set(selectedProducts);
        if (checked) {
            newSelected.add(managementNumber);
        } else {
            newSelected.delete(managementNumber);
        }
        setSelectedProducts(newSelected);
    };

    const handleDeleteProduct = async (managementNumber) => {
        if (confirm('この商品を削除しますか？')) {
            try {
                await deleteProduct(managementNumber);
                await loadProducts();
                setSelectedProducts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(managementNumber);
                    return newSet;
                });
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('商品の削除に失敗しました: ' + error.message);
            }
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedProducts.size === 0) return;

        if (confirm(`${selectedProducts.size}個の商品を削除しますか？`)) {
            try {
                await Promise.all(
                    Array.from(selectedProducts).map(managementNumber =>
                        deleteProduct(managementNumber)
                    )
                );
                await loadProducts();
                setSelectedProducts(new Set());
            } catch (error) {
                console.error('Error deleting products:', error);
                alert('商品の削除に失敗しました: ' + error.message);
            }
        }
    };

    const getRankBadge = (rank) => {
        const colors = {
            'A': 'bg-green-100 text-green-800 border-green-200',
            'B': 'bg-orange-100 text-orange-800 border-orange-200',
            'C': 'bg-red-100 text-red-800 border-red-200'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[rank] || colors['C']}`}>
                ランク{rank}
            </span>
        );
    };

    const filteredProducts = products.filter(product => {
        if (!filters.search) return true;
        const searchTerm = filters.search.toLowerCase();
        return (
            product.managementNumber.toLowerCase().includes(searchTerm) ||
            (product.title && product.title.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
    });

    return (
        <div className="min-h-full bg-gray-50 py-8">
            <div className="container mx-auto px-6 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">商品一覧</h1>
                        <p className="text-gray-600">データベースに保存された商品の一覧を表示します</p>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">フィルター:</span>
                        </div>

                        <select
                            value={filters.rank}
                            onChange={(e) => setFilters(prev => ({ ...prev, rank: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">生成ランク▼</option>
                            <option value="A">ランクA</option>
                            <option value="B">ランクB</option>
                            <option value="C">ランクC</option>
                        </select>

                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="検索..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {selectedProducts.size > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                選択した商品を削除 ({selectedProducts.size})
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="p-4 text-left font-semibold text-gray-900">管理番号</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">タイトル</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">生成ランク</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">カテゴリ</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">ランク</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">作成日</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-500">
                                            読み込み中...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-500">
                                            商品が見つかりません
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <motion.tr
                                            key={product.managementNumber}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.has(product.managementNumber)}
                                                    onChange={(e) => handleSelectProduct(product.managementNumber, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-4 font-mono text-sm text-gray-900">
                                                {product.managementNumber}
                                            </td>
                                            <td className="p-4">
                                                <div className="max-w-xs truncate" title={product.title}>
                                                    {product.title || 'タイトル未設定'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {product.level}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {product.category || '未分類'}
                                            </td>
                                            <td className="p-4">
                                                {getRankBadge(product.level)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(product.createdAt).toLocaleDateString('ja-JP')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => onNavigateToDetails(product.managementNumber)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-300"
                                                        title="詳細を見る"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.managementNumber)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300"
                                                        title="削除"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                ページ {currentPage} / {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProductsViewPage;
