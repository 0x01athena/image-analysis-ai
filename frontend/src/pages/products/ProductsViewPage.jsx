import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, ChevronLeft, ChevronRight, Filter, Search, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllProducts, deleteProduct, deleteMultipleProducts, exportExcelFile } from '../../api/batchApi';
import { useUserSession } from '../../hooks/useUserSession';

const ProductsViewPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedUser } = useUserSession();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [deleting, setDeleting] = useState(false);

    // Get pagination params from URL or use defaults
    const currentPage = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('size')) || 100;
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        rank: searchParams.get('rank') || '',
        date: searchParams.get('date') || '',
        search: searchParams.get('search') || '',
        worker: searchParams.get('worker') || '',
        category: searchParams.get('category') || '',
        condition: searchParams.get('condition') || '',
        folderId: searchParams.get('folderId') || ''
    });

    const loadProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page: String(currentPage),
                limit: String(pageSize),
                ...(filters.rank && filters.rank.trim() && { rank: filters.rank.trim() }),
                ...(filters.date && { date: filters.date }),
                ...(filters.worker && { worker: filters.worker }),
                ...(filters.category && { category: filters.category }),
                ...(filters.condition && { condition: filters.condition }),
                ...(filters.search && filters.search.trim() && { search: filters.search.trim() }),
                ...(filters.folderId && filters.folderId.trim() && { folderId: filters.folderId.trim() })
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

    // Update URL parameters
    const updateURLParams = (newParams) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value && value !== '') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        setSearchParams(params);
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        updateURLParams({ page: newPage });
    };

    const handlePageSizeChange = (newSize) => {
        updateURLParams({ size: newSize, page: 1 }); // Reset to page 1 when changing page size
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
        updateURLParams({ [filterType]: value, page: 1 }); // Reset to page 1 when filtering
    };

    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        updateURLParams({ search: value, page: 1 }); // Reset to page 1 when searching
    };

    const handleClearFilters = () => {
        setFilters({
            rank: '',
            date: '',
            search: '',
            worker: '',
            category: '',
            condition: '',
            folderId: ''
        });
        updateURLParams({
            rank: '',
            date: '',
            search: '',
            worker: '',
            category: '',
            condition: '',
            folderId: '',
            page: 1
        });
    };

    // Get unique values for filter dropdowns
    const getUniqueWorkers = () => {
        const workers = products.map(p => p.user?.username).filter(Boolean);
        return [...new Set(workers)].sort();
    };

    const getUniqueCategories = () => {
        const categories = products.map(p => p.category).filter(Boolean);
        return [...new Set(categories)].sort();
    };

    const getUniqueConditions = () => {
        const conditions = products.map(p => p.condition).filter(Boolean);
        return [...new Set(conditions)].sort();
    };

    const handleDirectPageInput = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= totalPages) {
            handlePageChange(value);
        }
    };

    // Sync filters with URL params when they change
    useEffect(() => {
        const rankFromUrl = searchParams.get('rank') || '';
        const dateFromUrl = searchParams.get('date') || '';
        const searchFromUrl = searchParams.get('search') || '';
        const workerFromUrl = searchParams.get('worker') || '';
        const categoryFromUrl = searchParams.get('category') || '';
        const conditionFromUrl = searchParams.get('condition') || '';
        const folderIdFromUrl = searchParams.get('folderId') || '';

        setFilters(prev => {
            // Only update if values changed to avoid infinite loops
            if (prev.rank !== rankFromUrl || prev.date !== dateFromUrl || prev.search !== searchFromUrl ||
                prev.worker !== workerFromUrl || prev.category !== categoryFromUrl || prev.condition !== conditionFromUrl ||
                prev.folderId !== folderIdFromUrl) {
                return {
                    rank: rankFromUrl,
                    date: dateFromUrl,
                    search: searchFromUrl,
                    worker: workerFromUrl,
                    category: categoryFromUrl,
                    condition: conditionFromUrl,
                    folderId: folderIdFromUrl
                };
            }
            return prev;
        });
    }, [searchParams]);

    useEffect(() => {
        loadProducts();
    }, [currentPage, pageSize, filters.rank, filters.date, filters.worker, filters.category, filters.condition, filters.search, filters.folderId]);

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
                setDeleting(true);
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
            } finally {
                setDeleting(false);
            }
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedProducts.size === 0) {
            alert('削除する商品を選択してください');
            return;
        }

        const selectedArray = Array.from(selectedProducts);
        const confirmMessage = `選択された ${selectedArray.length} 個の商品を削除しますか？\n\nこの操作は元に戻せません。`;

        if (confirm(confirmMessage)) {
            try {
                setDeleting(true);
                const result = await deleteMultipleProducts(selectedArray);

                if (result.data.totalFailed > 0) {
                    alert(`削除完了: ${result.data.totalDeleted}個成功, ${result.data.totalFailed}個失敗\n\n失敗した商品: ${result.data.failed.join(', ')}`);
                }

                // Clear selection and reload products
                setSelectedProducts(new Set());
                loadProducts();
            } catch (error) {
                console.error('Error deleting products:', error);
                alert('削除に失敗しました: ' + error.message);
            } finally {
                setDeleting(false);
            }
        }
    };

    const handleExportExcel = async () => {
        try {
            // Pass current filters to export function
            const exportFilters = {
                ...(filters.rank && filters.rank.trim() && { rank: filters.rank.trim() }),
                ...(filters.date && { date: filters.date }),
                ...(filters.worker && { worker: filters.worker }),
                ...(filters.category && { category: filters.category }),
                ...(filters.condition && { condition: filters.condition }),
                ...(filters.search && filters.search.trim() && { search: filters.search.trim() })
            };

            const result = await exportExcelFile(exportFilters);
            if (result.success) {
                const filterCount = Object.keys(exportFilters).length;
                const message = filterCount > 0 
                    ? `フィルター適用済みのExcelファイルのエクスポートが完了しました！\n（${filterCount}個のフィルターが適用されています）`
                    : 'Excelファイルのエクスポートが完了しました！';
                alert(message);
            } else {
                const errorMessage = result.error || 'Unknown error';
                const managementNumber = result.managementNumber;

                if (managementNumber) {
                    const confirmed = window.confirm(
                        `エクスポートに失敗しました: ${errorMessage}\n\n` +
                        `問題のある商品の詳細ページに移動しますか？\n` +
                        `管理番号: ${managementNumber}`
                    );

                    if (confirmed) {
                        navigate(`/products/${managementNumber}`);
                    }
                } else {
                    alert('エクスポートに失敗しました: \n' + errorMessage);
                }
            }
        } catch (error) {
            console.error('Error exporting Excel:', error);
            const managementNumber = error.managementNumber;

            if (managementNumber) {
                const confirmed = window.confirm(
                    `エクスポートエラー: ${error.message}\n\n` +
                    `問題のある商品の詳細ページに移動しますか？\n` +
                    `管理番号: ${managementNumber}`
                );

                if (confirmed) {
                    navigate(`/products/${managementNumber}`);
                }
            } else {
                alert('エクスポートエラー: ' + error.message);
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
                {rank ? `ランク ${rank}` : '作成中'}
            </span>
        );
    };


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
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">商品一覧</h1>
                                <p className="text-gray-600">データベースに保存された商品の一覧を表示します</p>
                            </div>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md hover:shadow-lg"
                            >
                                <Download size={20} />
                                Excelエクスポート
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Filters */}
                    <div className="mb-6 bg-gray-50 rounded-lg p-6 pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-500" />
                                <span className="text-lg font-semibold text-gray-700">フィルター</span>
                            </div>
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors duration-200"
                            >
                                すべてクリア
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="検索..."
                                    value={filters.search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Rank Filter */}
                            <select
                                value={filters.rank}
                                onChange={(e) => handleFilterChange('rank', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">生成ランク</option>
                                <option value="A">ランクA</option>
                                <option value="B">ランクB</option>
                            </select>

                            {/* Worker Filter */}
                            <select
                                value={filters.worker}
                                onChange={(e) => handleFilterChange('worker', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">作業者</option>
                                {getUniqueWorkers().map(worker => (
                                    <option key={worker} value={worker}>{worker}</option>
                                ))}
                            </select>

                            {/* Date Filter */}
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Active Filters Display */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {Object.entries(filters).map(([key, value]) => {
                                if (!value) return null;
                                const labels = {
                                    rank: 'ランク',
                                    worker: '作業者',
                                    category: 'カテゴリ',
                                    condition: '状態',
                                    date: '日付',
                                    search: '検索'
                                };
                                return (
                                    <span
                                        key={key}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                    >
                                        {labels[key]}: {key === 'date' ? new Date(value).toLocaleDateString('ja-JP') : value}
                                        <button
                                            onClick={() => handleFilterChange(key, '')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedProducts.size > 0 && (
                        <div className="mb-6 flex justify-end">
                            <button
                                onClick={handleDeleteSelected}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                選択した商品を削除 ({selectedProducts.size})
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.size === products.length && products.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="p-4 text-left font-semibold text-gray-900">管理番号</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">タイトル</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">生成ランク</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">カテゴリ</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">ランク</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">作業者</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">作成日</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-500">
                                            読み込み中...
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-500">
                                            商品が見つかりません
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
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
                                                    {product.title || 'タイトル作成中'}
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
                                                {product.user?.username || '未設定'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(product.createdAt).toLocaleDateString('ja-JP')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            // Preserve current filter params when navigating to details page
                                                            const params = new URLSearchParams();
                                                            if (filters.rank) params.append('rank', filters.rank);
                                                            if (filters.date) params.append('date', filters.date);
                                                            if (filters.worker) params.append('worker', filters.worker);
                                                            if (filters.category) params.append('category', filters.category);
                                                            if (filters.condition) params.append('condition', filters.condition);
                                                            if (filters.search) params.append('search', filters.search);
                                                            if (filters.folderId) params.append('folderId', filters.folderId);
                                                            const queryString = params.toString();
                                                            const path = queryString 
                                                                ? `/products/${product.managementNumber}?${queryString}`
                                                                : `/products/${product.managementNumber}`;
                                                            navigate(path);
                                                        }}
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

                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                                {/* Page Info */}
                                <div className="text-sm text-gray-700">
                                    ページ {currentPage} / {totalPages} ({products.length}件表示中)
                                </div>

                                {/* Page Size Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">表示件数:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value={10}>10件</option>
                                        <option value={25}>25件</option>
                                        <option value={50}>50件</option>
                                        <option value={100}>100件</option>
                                    </select>
                                </div>

                                {/* Direct Page Input */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">ページ:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={currentPage}
                                        onChange={handleDirectPageInput}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <span className="text-sm text-gray-600">/ {totalPages}</span>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center gap-1">
                                    {/* First Page */}
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-gray-200"
                                        title="最初のページ"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>

                                    {/* Previous Page */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-gray-200"
                                        title="前のページ"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const pages = [];
                                            const startPage = Math.max(1, currentPage - 2);
                                            const endPage = Math.min(totalPages, currentPage + 2);

                                            // Show first page if not in range
                                            if (startPage > 1) {
                                                pages.push(
                                                    <button
                                                        key={1}
                                                        onClick={() => handlePageChange(1)}
                                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                                                    >
                                                        1
                                                    </button>
                                                );
                                                if (startPage > 2) {
                                                    pages.push(
                                                        <span key="ellipsis1" className="px-2 text-gray-400">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                            }

                                            // Show pages in range
                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePageChange(i)}
                                                        className={`px-3 py-1 text-sm rounded ${i === currentPage
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {i}
                                                    </button>
                                                );
                                            }

                                            // Show last page if not in range
                                            if (endPage < totalPages) {
                                                if (endPage < totalPages - 1) {
                                                    pages.push(
                                                        <span key="ellipsis2" className="px-2 text-gray-400">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                pages.push(
                                                    <button
                                                        key={totalPages}
                                                        onClick={() => handlePageChange(totalPages)}
                                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                                                    >
                                                        {totalPages}
                                                    </button>
                                                );
                                            }

                                            return pages;
                                        })()}
                                    </div>

                                    {/* Next Page */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-gray-200"
                                        title="次のページ"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>

                                    {/* Last Page */}
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-gray-200"
                                        title="最後のページ"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Spinner Overlay */}
            {deleting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
                        <img
                            src="/src/assets/spinner.gif"
                            alt="Loading..."
                            className="w-12 h-12"
                        />
                        <p className="text-gray-700 font-medium">商品を削除中...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsViewPage;
