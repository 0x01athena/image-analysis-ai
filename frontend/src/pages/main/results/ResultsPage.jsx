import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertTriangle, Trophy, FileText, BarChart3 } from 'lucide-react';

const ResultsPage = () => {
    const [selectedRank, setSelectedRank] = useState('');

    // Sample data - in real app this would come from API
    const summaryData = {
        totalProcessed: 1,
        rankA: 0,
        rankB: 0,
        rankC: 1,
        success: 0,
        error: 1
    };

    const processingResults = [
        {
            id: '1759983973912-i0wibuuab',
            imageCount: 3,
            status: 'error',
            rank: 'C',
            timestamp: '2025/10/9 13:26:13',
            errorMessage: 'Server responded with status: 400'
        }
    ];

    const handleBatchExport = () => {
        alert('全商品一括CSVエクスポートを開始します');
    };

    const handleRankExport = (rank) => {
        alert(`${rank}ランクのエクスポートを開始します`);
    };

    const handleErrorLogExport = () => {
        alert('エラーログをエクスポートします');
    };

    const successRate = summaryData.totalProcessed > 0
        ? Math.round((summaryData.success / summaryData.totalProcessed) * 100)
        : 0;

    return (
        <div className="min-h-full bg-gray-50 py-8">
            <div className="container mx-auto px-6 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6"
                >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <div className="text-2xl font-bold text-gray-900">{summaryData.totalProcessed}</div>
                            <div className="text-sm text-gray-600">総処理数</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <div className="text-2xl font-bold text-green-600">{summaryData.rankA}</div>
                            <div className="text-sm text-gray-600">ランクA</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <div className="text-2xl font-bold text-orange-600">{summaryData.rankB}</div>
                            <div className="text-sm text-gray-600">ランクB</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <div className="text-2xl font-bold text-red-600">{summaryData.rankC}</div>
                            <div className="text-sm text-gray-600">ランクC</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <div className="text-2xl font-bold text-green-600">{summaryData.success}</div>
                            <div className="text-sm text-gray-600">成功</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <div className="text-2xl font-bold text-red-600">{summaryData.error}</div>
                            <div className="text-sm text-gray-600">エラー</div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Left Column - Processing Results List */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    処理結果一覧 ({processingResults.length}件)
                                </h2>
                                <p className="text-sm text-gray-600">
                                    最新の処理結果から順番に表示されます
                                </p>
                            </div>

                            <div className="space-y-4">
                                {processingResults.map((result, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-semibold text-gray-900">
                                                {result.id} ({result.imageCount}枚)
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    エラー
                                                </span>
                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    ランク C
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">
                                            {result.timestamp}
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-red-600">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>エラー内容: {result.errorMessage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column - CSV Export and Statistics */}
                        <div className="space-y-6">
                            {/* CSV Export Section */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">CSVエクスポート</h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    処理結果をCSVファイルとしてエクスポート
                                </p>

                                {/* Batch Export */}
                                <div className="mb-6">
                                    <button
                                        onClick={handleBatchExport}
                                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center gap-2 mb-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        全商品一括CSVエクスポート (出品フォーマット)
                                    </button>
                                    <p className="text-xs text-gray-500 text-center">
                                        成功した{summaryData.success}商品を39列の出品フォーマットで一括エクスポート
                                    </p>
                                </div>

                                {/* Export by Rank */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">ランク別エクスポート</h4>
                                    <div className="space-y-2">
                                        <div
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedRank === 'A' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => setSelectedRank('A')}
                                        >
                                            <span className="text-sm text-gray-700">ランクA (優秀)</span>
                                            <span className="text-sm font-medium text-gray-900">{summaryData.rankA}件</span>
                                        </div>
                                        <div
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedRank === 'B' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => setSelectedRank('B')}
                                        >
                                            <span className="text-sm text-gray-700">ランクB (良好)</span>
                                            <span className="text-sm font-medium text-gray-900">{summaryData.rankB}件</span>
                                        </div>
                                        <div
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedRank === 'C' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => setSelectedRank('C')}
                                        >
                                            <span className="text-sm text-gray-700">ランクC (要改善)</span>
                                            <span className="text-sm font-medium text-gray-900">{summaryData.rankC}件</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Log Export */}
                                <div>
                                    <button
                                        onClick={handleErrorLogExport}
                                        className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center justify-center gap-2 mb-2"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        エラーログをエクスポート ({summaryData.error}件)
                                    </button>
                                    <p className="text-xs text-gray-500 text-center">
                                        累積エラーログに追記保存されます
                                    </p>
                                </div>
                            </div>

                            {/* Processing Statistics */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <BarChart3 className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-bold text-gray-900">処理統計</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">総処理数:</span>
                                        <span className="font-medium text-gray-900">{summaryData.totalProcessed}件</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">成功:</span>
                                        <span className="font-medium text-green-600">{summaryData.success}件</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">エラー:</span>
                                        <span className="font-medium text-red-600">{summaryData.error}件</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">成功率:</span>
                                        <span className="font-medium text-gray-900">{successRate}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ResultsPage;
