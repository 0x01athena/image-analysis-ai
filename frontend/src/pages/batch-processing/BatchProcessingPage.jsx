import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FolderOpen, AlertTriangle, Trophy, Play } from 'lucide-react';

const BatchProcessingPage = () => {
    const [directoryPath, setDirectoryPath] = useState('');

    const handleDirectorySelect = () => {
        // This would typically open a directory picker
        // For now, we'll just show an alert
        alert('ディレクトリ選択機能は実装予定です');
    };

    const handleStartBatchProcessing = () => {
        if (!directoryPath.trim()) {
            alert('画像ディレクトリパスを入力してください');
            return;
        }
        alert('バッチ処理を開始します');
    };

    return (
        <div className="min-h-full bg-gray-50 py-8">
            <div className="container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">一括処理 (最大5000点)</h1>
                        <p className="text-gray-600">画像ディレクトリを指定して、管理番号ごとに自動でタイトルを生成します</p>
                    </div>

                    {/* On-site Workflow Section */}
                    <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">現場作業流れ</h2>
                        </div>
                        <ol className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                                撮影をする
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                                保有撮影アプリで画像名を管理番号にリネーム
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                                生成システムで生成
                                <div className="ml-4 mt-1 space-y-1">
                                    <div className="text-xs">A = 成功 (文字数規定以上)</div>
                                    <div className="text-xs">B = 成功 (文字数規定以下)</div>
                                    <div className="text-xs">C = 失敗</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                                ABはカテゴリをタイトル文字から自動選択
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</span>
                                タイトル、カテゴリ、採寸、コンディションが揃ったので指定マクロ書式で出力
                            </li>
                        </ol>
                    </div>

                    {/* Image Directory Path Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">画像ディレクトリパス</h2>
                        <p className="text-sm text-gray-600 mb-2">例: /path/to/images</p>
                        <div className="flex gap-3 mb-3">
                            <input
                                type="text"
                                value={directoryPath}
                                onChange={(e) => setDirectoryPath(e.target.value)}
                                placeholder="画像ディレクトリのパスを入力してください"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleDirectorySelect}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                            >
                                <FolderOpen className="w-4 h-4" />
                                ディレクトリを選択
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">処理したい商品画像を含むディレクトリを選択または入力してください</p>
                        <p className="text-xs text-gray-500">※サーバー上のパスを入力するか、プラウザからディレクトリを選択できます</p>
                    </div>

                    {/* Processing Information Section */}
                    <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <h2 className="text-lg font-semibold text-gray-900">処理について</h2>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li>• 画像ファイル名から13桁の管理番号を自動抽出します</li>
                            <li>• 同じ管理番号の画像は1つの商品として処理されます</li>
                            <li>• 処理は12時間以内に自動で完了します</li>
                            <li>• 失敗した商品のログは自動でCSVに蓄積されます</li>
                            <li>• 対応画像形式: JPG, PNG, GIF, BMP, WebP</li>
                        </ul>
                    </div>

                    {/* Rank System Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">ランクシステム</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <Trophy className="w-5 h-5 text-green-600" />
                                <div>
                                    <div className="font-semibold text-green-800">ランクA</div>
                                    <div className="text-sm text-green-600">文字数規定達成</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <Trophy className="w-5 h-5 text-orange-600" />
                                <div>
                                    <div className="font-semibold text-orange-800">ランクB</div>
                                    <div className="text-sm text-orange-600">文字数規定未達成</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <Trophy className="w-5 h-5 text-red-600" />
                                <div>
                                    <div className="font-semibold text-red-800">ランクC</div>
                                    <div className="text-sm text-red-600">生成失敗</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Start Batch Processing Button */}
                    <div className="text-center">
                        <button
                            onClick={handleStartBatchProcessing}
                            className="bg-purple-600 text-white px-12 py-4 rounded-xl text-lg font-semibold shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
                        >
                            <Play className="w-5 h-5" />
                            バッチ処理を開始
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BatchProcessingPage;
