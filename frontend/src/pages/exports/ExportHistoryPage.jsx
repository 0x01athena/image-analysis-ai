import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, History, User, Calendar, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExportHistory, deleteExportHistory } from '../../api/batchApi';
import { BACKEND_URL } from '../../api/config';

const ExportHistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState(null); // 'user' or 'date'
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

    const loadHistory = async () => {
        try {
            setLoading(true);
            const response = await getExportHistory();
            setHistory(response.data);
        } catch (error) {
            console.error('Error loading export history:', error);
            alert('履歴の読み込みに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, fileName) => {
        if (!window.confirm(`本当に「${fileName}」を削除しますか？`)) {
            return;
        }

        try {
            await deleteExportHistory(id);
            await loadHistory();
        } catch (error) {
            console.error('Error deleting export history:', error);
            alert('削除に失敗しました: ' + error.message);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new field and default to desc for date, asc for user
            setSortField(field);
            setSortDirection(field === 'date' ? 'desc' : 'asc');
        }
    };

    const sortedHistory = useMemo(() => {
        if (!sortField) return history;

        const sorted = [...history].sort((a, b) => {
            let comparison = 0;

            if (sortField === 'user') {
                const userA = (a.user?.username || '不明').toLowerCase();
                const userB = (b.user?.username || '不明').toLowerCase();
                comparison = userA.localeCompare(userB);
            } else if (sortField === 'date') {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                comparison = dateA - dateB;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }, [history, sortField, sortDirection]);

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <div className="bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <History size={32} />
                                エクスポート履歴
                            </h1>
                            <p className="text-gray-600">Excelファイルのエクスポート履歴を表示します</p>
                        </div>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                        >
                            商品一覧に戻る
                        </button>
                    </div>
                </motion.div>

                {/* History Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20">
                            <History size={64} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">エクスポート履歴がありません</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            番号
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                                            onClick={() => handleSort('user')}
                                        >
                                            <div className="flex items-center gap-2">
                                                ユーザー
                                                {sortField === 'user' && (
                                                    sortDirection === 'asc' ?
                                                        <ChevronUp size={16} className="text-blue-600" /> :
                                                        <ChevronDown size={16} className="text-blue-600" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            ファイル名
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center gap-2">
                                                エクスポート日時
                                                {sortField === 'date' && (
                                                    sortDirection === 'asc' ?
                                                        <ChevronUp size={16} className="text-blue-600" /> :
                                                        <ChevronDown size={16} className="text-blue-600" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedHistory.map((item, index) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {item.user?.username || '不明'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">
                                                    {item.fileName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    <span className="text-sm text-gray-700">
                                                        {new Date(item.createdAt).toLocaleString('ja-JP')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`${BACKEND_URL}/public${item.fileUrl}`}
                                                        download={item.fileName}
                                                        className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300"
                                                        title="ダウンロード"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.fileName)}
                                                        className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-300"
                                                        title="削除"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ExportHistoryPage;

