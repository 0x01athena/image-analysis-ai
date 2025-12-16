import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder, Trash2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllFolders, deleteFolder, exportExcelFile } from '../../api/batchApi';
import { useUserSession } from '../../hooks/useUserSession';
import { BACKEND_URL } from '../../api/config';
import { formatJSTDate, formatJSTLocale } from '../../utils/dateUtils';

const FoldersPage = () => {
    const navigate = useNavigate();
    const { selectedUser } = useUserSession();

    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(new Set());

    const loadFolders = async () => {
        try {
            setLoading(true);
            const response = await getAllFolders();
            if (response.success) {
                // Calculate actual product counts from _count if available
                const foldersWithCounts = response.data.map(folder => ({
                    ...folder,
                    numberOfUploadedProducts: folder._count?.products || folder.numberOfUploadedProducts || 0
                }));
                setFolders(foldersWithCounts);
            }
        } catch (error) {
            console.error('Error loading folders:', error);
            alert('フォルダーの読み込みに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFolders();
    }, []);

    const handleExportExcel = async (folder) => {
        try {
            setExporting(prev => new Set(prev).add(folder.id));

            const filters = {
                folderId: folder.id
            };

            const result = await exportExcelFile(filters);
            if (result.success) {
                // Reload folders to get updated excelFileName
                await loadFolders();
                alert('Excelファイルのエクスポートが完了しました！');
            } else {
                alert('エクスポートに失敗しました: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('エクスポートエラー: ' + error.message);
        } finally {
            setExporting(prev => {
                const newSet = new Set(prev);
                newSet.delete(folder.id);
                return newSet;
            });
        }
    };

    const handleDownloadExcel = (folder) => {
        // Download the existing Excel file from the exports directory
        const downloadUrl = `${BACKEND_URL}/exports/${folder.excelFileName}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = folder.excelFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGoToProducts = (folder) => {
        // Format the folder creation date as YYYY-MM-DD in JST
        const folderDate = formatJSTDate(folder.createdAt);

        // Get username from folder.user or use folder.userId
        const username = folder.user?.username || folder.userId;

        // Navigate to products page with filters
        const params = new URLSearchParams({
            worker: username,
            date: folderDate,
            folderId: folder.id
        });

        navigate(`/products?${params.toString()}`);
    };

    const handleDeleteFolder = async (folder) => {
        if (!confirm(`フォルダー "${folder.foldername}" を削除しますか？\nこの操作は元に戻せません。`)) {
            return;
        }

        try {
            setDeleting(true);
            await deleteFolder(folder.id);
            await loadFolders();
            alert('フォルダーが削除されました');
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert('フォルダーの削除に失敗しました: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        return formatJSTLocale(dateString, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
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
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">フォルダー管理</h1>
                                <p className="text-gray-600">アップロードされたフォルダーの一覧を表示します</p>
                            </div>
                            <button
                                onClick={loadFolders}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md hover:shadow-lg"
                            >
                                <RefreshCw size={20} />
                                更新
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-4 text-left font-semibold text-gray-900">No</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">フォルダー名</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">ユーザー</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">商品数</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">Excelファイル名</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">作成日</th>
                                    <th className="p-4 text-left font-semibold text-gray-900">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            読み込み中...
                                        </td>
                                    </tr>
                                ) : folders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            フォルダーが見つかりません
                                        </td>
                                    </tr>
                                ) : (
                                    folders.map((folder, index) => (
                                        <motion.tr
                                            key={folder.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{index + 1}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium text-gray-900">{folder.foldername}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-900">
                                                {folder.user?.username || folder.userId || '未設定'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {folder.numberOfUploadedProducts} 件
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {folder.excelFileName ? (
                                                    <span className="text-green-600 font-medium">{folder.excelFileName}</span>
                                                ) : (
                                                    <span className="text-gray-400">未エクスポート</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {formatDate(folder.createdAt)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {/* Go to Product Page Button */}
                                                    <button
                                                        onClick={() => handleGoToProducts(folder)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-300"
                                                        title="商品ページへ移動"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>

                                                    {/* Download Excel Button - shown when Excel file exists */}
                                                    {/* {folder.excelFileName && ( */}
                                                    <button
                                                        onClick={() => handleExportExcel(folder)}
                                                        disabled={exporting.has(folder.id)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Excelファイルをエクスポート"
                                                    >
                                                        {exporting.has(folder.id) ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    {/* )} */}

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteFolder(folder)}
                                                        disabled={deleting}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="フォルダーを削除"
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
                        <p className="text-gray-700 font-medium">フォルダーを削除中...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoldersPage;

