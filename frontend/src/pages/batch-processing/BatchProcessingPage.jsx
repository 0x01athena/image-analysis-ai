import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, FolderOpen, Trophy, Play, Upload, CheckCircle, XCircle, Clock, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { uploadDirectoryImages, startBatchProcessing } from '../../api/batchApi';
import { useTaskStatus } from '../../hooks/useTaskStatus';
import spinner from '../../assets/spinner.gif';

const BatchProcessingPage = () => {
    const [directoryPath, setDirectoryPath] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isWorking, setIsWorking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [uploadSummary, setUploadSummary] = useState(null);
    const [skippedFiles, setSkippedFiles] = useState([]);
    const [fileStats, setFileStats] = useState({
        totalProducts: 0,
        availableProducts: 0,
        lockedProducts: 0,
        uploadedProducts: 0
    });
    const [lockedProducts, setLockedProducts] = useState([]);
    const [isLockedProductsExpanded, setIsLockedProductsExpanded] = useState(false);
    const [processCompleted, setProcessCompleted] = useState(false);
    const fileInputRef = useRef(null);

    // Use the task status hook for periodic polling - no initial sessionId needed
    const { taskStatus, isPolling, error, startPolling } = useTaskStatus();

    // Manage state transitions based on task status
    useEffect(() => {
        if (taskStatus) {
            // Update states based on task status
            if (taskStatus.uploadStatus && taskStatus.uploadStatus.isUploading) {
                setIsUploading(true);
            } else {
                setIsUploading(false);
            }

            if (taskStatus.isProcessing) {
                setIsProcessing(true);
            } else {
                setIsProcessing(false);
            }

            // Set isWorking based on any active task
            const hasActiveTask = taskStatus.isProcessing || (taskStatus.uploadStatus && taskStatus.uploadStatus.isUploading);
            setIsWorking(hasActiveTask);
        } else {
            setIsUploading(false);
            setIsProcessing(false);
            setIsWorking(false);

            if (sessionId && !processCompleted) {
                setProcessCompleted(true);

                setSelectedFiles([]);
                setDirectoryPath('');

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    }, [taskStatus, sessionId]);

    // Check if there's an active task (upload or AI analysis in progress)
    const hasActiveTask = taskStatus && (taskStatus.isProcessing || (taskStatus.uploadStatus && taskStatus.uploadStatus.isUploading));
    // Also check if we have a sessionId but no taskStatus yet (during upload)
    const hasActiveSession = sessionId && !taskStatus;
    const isInterfaceDisabled = hasActiveTask || hasActiveSession || isUploading || isProcessing;

    const handleDirectorySelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelection = (event) => {
        const files = Array.from(event.target.files);

        // File size limit: 1MB (1 * 1024 * 1024 bytes)
        const maxFileSize = 1 * 1024 * 1024;
        const oversizedFiles = files.filter(file => file.size > maxFileSize);

        // Calculate product statistics
        const extractProductId = (filename) => {
            if (filename.includes('_')) {
                return filename.split('_')[0];
            }
            return filename;
        };

        // Get all unique product IDs from all files
        const allProductIds = [...new Set(files.map(file => extractProductId(file.name)))];

        // Get locked product IDs (from oversized files)
        const lockedProductIds = [...new Set(oversizedFiles.map(file => extractProductId(file.name)))];

        // Create detailed locked products list
        const lockedProductsDetails = lockedProductIds.map(productId => {
            const productFiles = oversizedFiles.filter(file => extractProductId(file.name) === productId);
            const totalSize = productFiles.reduce((sum, file) => sum + file.size, 0);

            return {
                productId,
                totalSize,
            };
        });

        // Update locked products
        setLockedProducts(lockedProductsDetails);

        // Get available product IDs (from valid files)
        const validFiles = files.filter(file => file.size <= maxFileSize);
        const availableProductIds = [...new Set(validFiles.map(file => extractProductId(file.name)))];

        // Update file statistics
        setFileStats({
            totalProducts: allProductIds.length,
            availableProducts: availableProductIds.length,
            lockedProducts: lockedProductIds.length,
            uploadedProducts: 0 // Will be updated after upload
        });

        if (oversizedFiles.length > 0) {
            setSelectedFiles(validFiles);
        } else {
            setSelectedFiles(files);
        }

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
        setIsWorking(true);

        try {
            const uploadResult = await uploadDirectoryImages(selectedFiles);
            console.log('Upload result:', uploadResult);

            // Store the sessionId from upload response
            if (uploadResult.success && uploadResult.data.sessionId) {
                setSessionId(uploadResult.data.sessionId);
                setUploadSummary(uploadResult.data.uploadSummary);
                setSkippedFiles(uploadResult.data.skippedFiles || []);

                setFileStats(prev => ({
                    ...prev,
                    uploadedProducts: uploadResult.data.totalProducts || 0
                }));

                startPolling(uploadResult.data.sessionId);
            } else {
                throw new Error('No session ID received from upload');
            }

            // Don't set isUploading to false here - let the task status manage it
            setIsProcessing(true);

            // Start batch processing using API function with sessionId
            const processingResult = await startBatchProcessing(uploadResult.data.sessionId);
            console.log('Processing started:', processingResult);

            if (processingResult.success) {
                startPolling(uploadResult.data.sessionId);
            }

        } catch (error) {
            console.error('Error starting batch processing:', error);
            alert('バッチ処理の開始に失敗しました: ' + error.message);
            setIsUploading(false);
            setIsProcessing(false);
            setIsWorking(false);
        }
        // Don't set isWorking to false in finally - let the task status manage it
    };

    // Task Status Display Component
    const TaskStatusDisplay = () => {
        if (!taskStatus) return null;

        const progressPercentage = taskStatus.totalProducts > 0
            ? Math.round((taskStatus.processedProducts / taskStatus.totalProducts) * 100)
            : 0;

        return (
            <div className="mb-8">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        AI分析進行状況
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">全体進捗</span>
                                <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-blue-600">{taskStatus.totalProducts}</div>
                                <div className="text-sm text-gray-600">総商品数</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-green-600">{taskStatus.processedProducts}</div>
                                <div className="text-sm text-gray-600">処理完了</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-red-600">{taskStatus.failedProducts}</div>
                                <div className="text-sm text-gray-600">処理失敗</div>
                            </div>
                            <div className="bg-white rounded-lg py-4 px-2 text-center shadow-sm">
                                <div className="text-xl font-bold text-purple-600">
                                    {taskStatus.currentProduct || '完了'}
                                </div>
                                <div className="text-sm text-gray-600">現在処理中</div>
                            </div>
                        </div>

                        {/* Flow Chart Style Status */}
                        <div className="flex items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-600">画像アップロード</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${taskStatus.isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                                <span className="text-gray-600">AI分析中</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${taskStatus.isProcessing ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                                <span className="text-gray-600">完了</span>
                            </div>
                        </div>

                        {taskStatus.startTime && (
                            <div className="mt-4 text-center text-xs text-gray-500">
                                開始時刻: {new Date(taskStatus.startTime).toLocaleString('ja-JP')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
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

                    {isWorking && (
                        <div className="flex justify-center items-center">
                            <img src={spinner} alt="spinner" className="w-10 h-10" />&nbsp;
                            {isUploading && <span className="text-gray-600">アップロード中...</span>}
                            {isProcessing && <span className="text-gray-600">処理中...</span>}
                        </div>
                    )}

                    {/* Task Status Display - Only show for AI analysis, not uploads */}
                    <TaskStatusDisplay />

                    {/* Process Completion Message */}
                    {processCompleted && !taskStatus && (
                        <div className="mb-8">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <h2 className="text-lg font-semibold text-green-800">処理完了</h2>
                                </div>
                                <p className="text-sm text-green-700">
                                    バッチ処理が正常に完了しました。結果を確認してから新しいファイルを選択できます。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Skipped Files Section */}
                    {skippedFiles.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-orange-600" />
                                スキップされたファイル
                            </h2>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                                <p className="text-sm text-orange-800 mb-4">
                                    {skippedFiles.length}個のファイルがスキップされました（ファイルサイズが5MBを超えるか、無効なファイル名パターン）
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {skippedFiles.map((file, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                            <span className="font-medium text-gray-800">{file.filename}</span>
                                            <div className="flex gap-4 text-xs">
                                                <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
                                                    {file.reason}
                                                </span>
                                                {file.size && (
                                                    <span className="text-gray-600">
                                                        {(file.size / (1024 * 1024)).toFixed(2)}MB
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Directory Selection Section - Disabled when task is active */}
                    <div className={`mb-8`}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">画像ディレクトリ選択</h2>
                        <p className="text-sm text-gray-600 mb-2">商品画像が保存されているフォルダを選択してください</p>
                        <p className="text-xs text-orange-600 mb-4 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                            ⚠️ ファイルサイズ制限: 各画像ファイルは1MB以下である必要があります
                        </p>



                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={directoryPath}
                                onChange={(e) => setDirectoryPath(e.target.value)}
                                placeholder="選択されたディレクトリ名"
                                className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isWorking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                readOnly
                                onClick={handleDirectorySelect}
                                disabled={isWorking}
                            />
                            <button
                                onClick={handleDirectorySelect}
                                disabled={isWorking}
                                className={`px-6 py-3 rounded-lg transition-colors duration-300 flex items-center gap-2 ${isWorking
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
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
                            disabled={isWorking}
                        />

                    </div>

                    {/* Locked Products Section */}
                    {lockedProducts.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    ロックされた商品 ({lockedProducts.length}件)
                                </h2>
                                <button
                                    onClick={() => setIsLockedProductsExpanded(!isLockedProductsExpanded)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    {isLockedProductsExpanded ? (
                                        <>
                                            <span>折りたたむ</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </>
                                    ) : (
                                        <>
                                            <span>展開する</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <p className="text-sm text-red-800 mb-4">
                                    以下の商品はファイルサイズが1MBを超えるため、アップロードから除外されます。
                                </p>

                                {/* Summary when collapsed */}
                                {!isLockedProductsExpanded && (
                                    <div className="text-sm text-red-700">
                                        <p>クリックして詳細を表示</p>
                                    </div>
                                )}

                                {/* Detailed list when expanded */}
                                {isLockedProductsExpanded && (
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {lockedProducts.map((product, index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg border border-red-100">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">{product.productId}</h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                                                            最大: {(product.totalSize / (1024 * 1024)).toFixed(2)}MB
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Start Batch Processing Button - Show when no active task */}
                    {!isWorking && (
                        <div className="text-center">
                            <button
                                onClick={handleStartBatchProcessing}
                                disabled={selectedFiles.length === 0}
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
                                ) : processCompleted ? (
                                    <>
                                        <Play className="w-5 h-5" />
                                        新しいバッチ処理を開始
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        バッチ処理を開始
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default BatchProcessingPage;
