import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, FolderOpen, AlertTriangle, Trophy, Play, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

const BatchProcessingPage = () => {
    const [directoryPath, setDirectoryPath] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState(null);
    const [processingResults, setProcessingResults] = useState(null);
    const fileInputRef = useRef(null);

    const handleDirectorySelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelection = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);

        // Extract directory path from first file
        if (files.length > 0) {
            const firstFile = files[0];
            const pathParts = firstFile.webkitRelativePath?.split('/') || [];
            if (pathParts.length > 1) {
                setDirectoryPath(pathParts[0]);
            }
        }
    };

    const handleStartBatchProcessing = async () => {
        if (selectedFiles.length === 0) {
            alert('画像ファイルを選択してください');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('images', file);
            });

            // Upload images
            const uploadResponse = await fetch('http://162.43.19.70/api/batch/upload-directory', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const uploadResult = await uploadResponse.json();
            console.log('Upload result:', uploadResult);

            setIsUploading(false);
            setIsProcessing(true);

            // Start batch processing
            const processingResponse = await fetch('http://162.43.19.70/api/batch/start-processing', {
                method: 'POST'
            });

            if (!processingResponse.ok) {
                throw new Error('Processing start failed');
            }

            const processingResult = await processingResponse.json();
            console.log('Processing started:', processingResult);

            // Start polling for status updates
            pollProcessingStatus();

        } catch (error) {
            console.error('Error starting batch processing:', error);
            alert('バッチ処理の開始に失敗しました: ' + error.message);
            setIsUploading(false);
            setIsProcessing(false);
        }
    };

    const pollProcessingStatus = async () => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch('http://162.43.19.70/api/batch/status');
                const status = await response.json();

                setProcessingStatus(status.data);

                if (!status.data.isProcessing) {
                    clearInterval(pollInterval);
                    setIsProcessing(false);

                    // Get final results
                    const resultsResponse = await fetch('http://162.43.19.70/api/batch/results');
                    const results = await resultsResponse.json();
                    setProcessingResults(results.data);
                }
            } catch (error) {
                console.error('Error polling status:', error);
                clearInterval(pollInterval);
                setIsProcessing(false);
            }
        }, 2000);
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

                    {/* Image Directory Selection Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">画像ディレクトリ選択</h2>
                        <p className="text-sm text-gray-600 mb-2">商品画像が保存されているフォルダを選択してください</p>
                        <p className="text-sm text-gray-600 mb-4">ファイル名形式: xxxxxx_1.jpg, xxxxxx_2.jpg, yyyyyyyy_1.jpg, yyyyyyyy_2.jpg...</p>

                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={directoryPath}
                                onChange={(e) => setDirectoryPath(e.target.value)}
                                placeholder="選択されたディレクトリ名"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                readOnly
                            />
                            <button
                                onClick={handleDirectorySelect}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                            >
                                <FolderOpen className="w-4 h-4" />
                                フォルダを選択
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelection}
                            className="hidden"
                            webkitdirectory=""
                        />

                        {selectedFiles.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-800">選択されたファイル</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    総ファイル数: {selectedFiles.length}個
                                </p>
                                <p className="text-sm text-green-700">
                                    ディレクトリ: {directoryPath}
                                </p>
                            </div>
                        )}
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

                    {/* Processing Status Section */}
                    {(isUploading || isProcessing || processingStatus) && (
                        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-900">処理状況</h2>
                            </div>

                            {isUploading && (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-blue-700">画像をアップロード中...</p>
                                </div>
                            )}

                            {isProcessing && processingStatus && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-blue-700">進行状況</span>
                                        <span className="text-sm text-blue-700">
                                            {processingStatus.processedProducts + processingStatus.failedProducts} / {processingStatus.totalProducts}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${((processingStatus.processedProducts + processingStatus.failedProducts) / processingStatus.totalProducts) * 100}%`
                                            }}
                                        ></div>
                                    </div>

                                    {processingStatus.currentProduct && (
                                        <p className="text-sm text-blue-700">
                                            現在処理中: {processingStatus.currentProduct}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-semibold text-green-600">{processingStatus.processedProducts}</div>
                                            <div className="text-gray-600">成功</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-red-600">{processingStatus.failedProducts}</div>
                                            <div className="text-gray-600">失敗</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-gray-600">
                                                {processingStatus.totalProducts - processingStatus.processedProducts - processingStatus.failedProducts}
                                            </div>
                                            <div className="text-gray-600">残り</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isProcessing && processingStatus && !processingStatus.isProcessing && (
                                <div className="text-center">
                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-green-700 font-semibold">処理完了!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Processing Results Section */}
                    {processingResults && (
                        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <Trophy className="w-5 h-5 text-green-600" />
                                <h2 className="text-lg font-semibold text-gray-900">処理結果</h2>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{processingResults.summary.rankA}</div>
                                    <div className="text-sm text-gray-600">ランクA</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">{processingResults.summary.rankB}</div>
                                    <div className="text-sm text-gray-600">ランクB</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{processingResults.summary.rankC}</div>
                                    <div className="text-sm text-gray-600">ランクC</div>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">
                                    総処理数: {processingResults.summary.total}件
                                </p>
                                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300">
                                    結果をCSVでダウンロード
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Start Batch Processing Button */}
                    <div className="text-center">
                        <button
                            onClick={handleStartBatchProcessing}
                            disabled={selectedFiles.length === 0 || isUploading || isProcessing}
                            className={`px-12 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto ${selectedFiles.length === 0 || isUploading || isProcessing
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-xl'
                                }`}
                        >
                            {isUploading ? (
                                <>
                                    <Upload className="w-5 h-5" />
                                    アップロード中...
                                </>
                            ) : isProcessing ? (
                                <>
                                    <Clock className="w-5 h-5" />
                                    処理中...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    バッチ処理を開始
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BatchProcessingPage;
