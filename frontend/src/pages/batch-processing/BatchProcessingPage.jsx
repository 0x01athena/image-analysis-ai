import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Play, CheckCircle, XCircle, Activity, User } from 'lucide-react';
import { startBatchProcessing, markWorkProcessFinished } from '../../api/batchApi';
import { useUserSession } from '../../hooks/useUserSession';
import { API_BASE_URL } from '../../api/config';
import { useUpload } from '../../contexts/UploadContext';
import spinner from '../../assets/spinner.gif';

const BatchProcessingPage = () => {
    const { setIsUploading: setGlobalUploading } = useUpload();
    const [directoryPath, setDirectoryPath] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isWorking, setIsWorking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [skippedFiles, setSkippedFiles] = useState([]);
    const [lockedProducts, setLockedProducts] = useState([]);
    const [isLockedProductsExpanded, setIsLockedProductsExpanded] = useState(false);
    const [processCompleted, setProcessCompleted] = useState(false);
    const [taskProgress, setTaskProgress] = useState({
        totalProducts: 0,
        completedProducts: 0,
        failedProducts: 0,
        currentProduct: null,
        startTime: null,
        isFinished: false
    });
    const [uploadProgress, setUploadProgress] = useState({
        percentage: 0,
        filesUploaded: 0,
        totalFiles: 0
    });
    const [price, setPrice] = useState('');
    const fileInputRef = useRef(null);
    const progressIntervalRef = useRef(null);

    // User session management
    const {
        users,
        selectedUser,
        currentSession,
        loading: usersLoading,
        error: usersError,
        saveSelectedUser,
        saveCurrentSession,
        clearCurrentSession,
        checkWorkProcessStatus
    } = useUserSession();

    // Check if there's an active task (upload or AI analysis in progress)
    const isInterfaceDisabled = isUploading || isProcessing;
    const canStartProcessing = !usersLoading && selectedUser && selectedFiles.length > 0 && !isInterfaceDisabled;

    // Function to check task progress
    const checkTaskProgress = async () => {
        if (!currentSession?.workProcessId) return;

        try {
            const status = await checkWorkProcessStatus(currentSession.workProcessId);
            if (status?.success) {
                const workProcess = status.data;
                const productIds = workProcess.productIds || [];
                const totalProducts = productIds.length;
                const finishedProducts = workProcess.finishedProducts || 0;
                const currentProductId = workProcess.currentProductId || null;

                setTaskProgress(prev => ({
                    ...prev,
                    totalProducts,
                    completedProducts: finishedProducts,
                    failedProducts: 0, // We can add failed tracking later if needed
                    currentProduct: currentProductId,
                    isFinished: workProcess.isFinished,
                    startTime: workProcess.createdAt
                }));

                // If task is finished, stop monitoring and reset UI
                if (workProcess.isFinished) {
                    stopProgressMonitoring();
                    handleTaskCompletion();
                }
            }
        } catch (error) {
            console.error('Error checking task progress:', error);
        }
    };

    // Start progress monitoring
    const startProgressMonitoring = () => {
        if (progressIntervalRef.current) return;

        progressIntervalRef.current = setInterval(checkTaskProgress, 2000);
    };

    // Stop progress monitoring
    const stopProgressMonitoring = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    // Handle task completion
    const handleTaskCompletion = () => {
        setIsProcessing(false);
        setIsUploading(false);
        setIsWorking(false);
        setProcessCompleted(true);

        // Clear form
        setSelectedFiles([]);
        setDirectoryPath('');
        setPrice('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Clear session after completion
        clearCurrentSession();

        // Reset task progress after a delay
        setTimeout(() => {
            setProcessCompleted(false);
            setTaskProgress({
                totalProducts: 0,
                completedProducts: 0,
                failedProducts: 0,
                currentProduct: null,
                startTime: null,
                isFinished: false
            });
        }, 3000);
    };

    // Handle clearing current work process session
    const handleClearWorkProcess = async () => {
        if (!currentSession?.workProcessId) {
            alert('クリアする作業プロセスがありません');
            return;
        }

        const confirmMessage = '現在の作業プロセスをクリアしますか？\n\nこの操作により、進行中の作業プロセスの追跡が停止され、データベースで作業プロセスが完了としてマークされます。';

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Mark work process as finished in backend
            await markWorkProcessFinished(currentSession.workProcessId);

            // Stop progress monitoring
            stopProgressMonitoring();

            // Clear session from localStorage
            clearCurrentSession();

            // Reset processing states
            setIsProcessing(false);
            setIsUploading(false);
            setIsWorking(false);

            // Reset task progress
            setTaskProgress({
                totalProducts: 0,
                completedProducts: 0,
                failedProducts: 0,
                currentProduct: null,
                startTime: null,
                isFinished: false
            });
        } catch (error) {
            console.error('Error clearing work process:', error);
            alert('作業プロセスのクリアに失敗しました: ' + error.message);
        }
    };

    // Initialize task monitoring on page load
    useEffect(() => {
        if (currentSession?.workProcessId) {
            // If there's an active session, start monitoring
            setIsProcessing(true);
            setIsWorking(true);
            startProgressMonitoring();
        }

        // Cleanup on unmount
        return () => {
            stopProgressMonitoring();
        };
    }, [currentSession?.workProcessId]);

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
        if (usersLoading) {
            alert('ユーザー情報を読み込み中です。しばらくお待ちください。');
            return;
        }

        // Validate user session exists and is valid
        if (!selectedUser) {
            alert('作業者を選択してください');
            return;
        }

        if (!selectedUser.id) {
            alert('作業者情報が無効です。もう一度選択してください。');
            return;
        }

        if (selectedFiles.length === 0) {
            alert('画像ファイルを選択してください');
            return;
        }

        // Store userId in a variable to prevent it from changing during upload
        const userId = selectedUser.id;

        setIsUploading(true);
        setIsWorking(true);
        setGlobalUploading(true);
        setUploadProgress({ percentage: 0, filesUploaded: 0, totalFiles: selectedFiles.length });

        try {
            // Upload with progress tracking
            const uploadResult = await uploadWithProgress(selectedFiles, userId, price);
            console.log('Upload result:', uploadResult);

            if (uploadResult.success) {
                setSkippedFiles(uploadResult.data.skippedFiles || []);

                // Save session to localStorage
                const sessionData = {
                    workProcessId: uploadResult.data.workProcessId,
                    userId: uploadResult.data.userId,
                    startTime: new Date().toISOString(),
                    productCount: uploadResult.data.totalProducts
                };
                saveCurrentSession(sessionData);

                // Mark upload as complete
                setUploadProgress(prev => ({ ...prev, percentage: 100 }));

                setIsUploading(false);
                setGlobalUploading(false);
                setIsProcessing(true);

                // Start batch processing using API function with workProcessId
                const processingResult = await startBatchProcessing(uploadResult.data.workProcessId);
                console.log('Processing started:', processingResult);

                if (processingResult.success) startProgressMonitoring();
            } else {
                throw new Error('Upload failed');
            }

        } catch (error) {
            console.error('Error starting batch processing:', error);
            
            // Provide more specific error messages
            let errorMessage = 'バッチ処理の開始に失敗しました';
            if (error.message) {
                if (error.message.includes('ユーザーIDが無効')) {
                    errorMessage = error.message;
                } else if (error.message.includes('User ID is required')) {
                    errorMessage = 'ユーザーIDが必要です。作業者を選択してください。';
                } else {
                    errorMessage += ': ' + error.message;
                }
            }
            
            alert(errorMessage);
            setIsUploading(false);
            setGlobalUploading(false);
            setIsProcessing(false);
            setIsWorking(false);
            setUploadProgress({ percentage: 0, filesUploaded: 0, totalFiles: 0 });
        }
    };

    // Upload with progress tracking using XMLHttpRequest
    const uploadWithProgress = (files, userId, priceValue) => {
        return new Promise((resolve, reject) => {
            // Validate userId before proceeding
            if (!userId || typeof userId !== 'string') {
                reject(new Error('ユーザーIDが無効です。作業者を選択してください。'));
                return;
            }

            const xhr = new XMLHttpRequest();
            const formData = new FormData();

            Array.from(files).forEach(file => {
                formData.append('images', file);
            });
            formData.append('userId', userId);
            if (priceValue && priceValue !== '') {
                formData.append('price', priceValue);
            }

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentage = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress({
                        percentage,
                        filesUploaded: selectedFiles.length,
                        totalFiles: selectedFiles.length
                    });
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });

            xhr.open('POST', `${API_BASE_URL}/batch/upload-directory`);
            xhr.send(formData);
        });
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

                    {/* Upload Progress Status */}
                    {isUploading && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                アップロード進行状況
                            </h2>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div>
                                    {/* Upload Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <img src={spinner} alt="spinner" className="w-6 h-6 rounded-full" />
                                                <span className="text-sm font-medium text-gray-700">アップロード進捗</span>
                                            </div>
                                            <span className="text-sm font-medium text-blue-600">
                                                {uploadProgress.percentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress.percentage}%` }}
                                                transition={{ duration: 0.5 }}
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-600">{uploadProgress.totalFiles}</div>
                                            <div className="text-sm text-gray-600">ファイル総数</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-green-600">{uploadProgress.filesUploaded}</div>
                                            <div className="text-sm text-gray-600">アップロード完了</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 text-center">
                                            <div className="text-lg font-bold text-gray-600">
                                                {uploadProgress.totalFiles > 0 ? Math.round((uploadProgress.filesUploaded / uploadProgress.totalFiles) * 100) : 0}%
                                            </div>
                                            <div className="text-sm text-gray-600">完了率</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Analysis Progress Status */}
                    {isProcessing && (
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                        AI分析進行状況
                                    </h2>
                                {currentSession?.workProcessId && (
                                    <button
                                        onClick={handleClearWorkProcess}
                                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
                                        title="現在の作業プロセスをクリア"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        現在の作業プロセスをクリア
                                    </button>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-6">
                                {taskProgress.totalProducts > 0 ? (
                                    <>
                                        {/* Overall Progress Bar */}
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <img src={spinner} alt="spinner" className="w-6 h-6 rounded-full" />
                                                    <span className="text-sm font-medium text-gray-700">全体進捗</span>
                                                </div>
                                                <span className="text-sm font-medium text-purple-600">
                                                    {Math.round((taskProgress.completedProducts / taskProgress.totalProducts) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(taskProgress.completedProducts / taskProgress.totalProducts) * 100}%` }}
                                                    transition={{ duration: 0.5 }}
                                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-purple-600">{taskProgress.totalProducts}</div>
                                                <div className="text-sm text-gray-600">総商品数</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-green-600">{taskProgress.completedProducts}</div>
                                                <div className="text-sm text-gray-600">処理完了</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-gray-600">{taskProgress.failedProducts}</div>
                                                <div className="text-sm text-gray-600">処理失敗</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-center">
                                                <div className="text-lg font-bold text-purple-600 truncate">
                                                    {taskProgress.currentProduct || '待機中'}
                                                </div>
                                                <div className="text-sm text-gray-600">現在処理中</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <img src={spinner} alt="spinner" className="w-6 h-6 rounded-full" />
                                            <span className="text-gray-600">処理を開始しています...</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            商品情報を読み込み中です。しばらくお待ちください。
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* User Selection */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                作業者選択
                            </h2>                            
                        </div>
                        <div>
                            {usersLoading ? (
                                <div className="flex items-center gap-2">
                                    <img src={spinner} alt="spinner" className="w-4 h-4 rounded-full" />
                                    <span className="text-gray-600">ユーザーを読み込み中...</span>
                                </div>
                            ) : usersError ? (
                                <div className="text-red-600">
                                    ユーザーの読み込みに失敗しました: {usersError}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-10">
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">作業者:</label>
                                            <select
                                                value={selectedUser?.id || ''}
                                                onChange={(e) => {
                                                    const user = users.find(u => u.id === e.target.value);
                                                    if (user) {
                                                        saveSelectedUser(user);
                                                    }
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isInterfaceDisabled}
                                            >
                                                <option value="">作業者を選択してください</option>
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.username}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">価格:</label>
                                            <input
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                placeholder="価格を入力"
                                                min="0"
                                                step="0.01"
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40"
                                                disabled={isInterfaceDisabled}
                                            />
                                            <span className="text-sm text-gray-600">円</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Process Completion Message */}
                    {processCompleted && !isWorking && (
                        <div className="mb-5">
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
                    <div className={`mb-4`}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">画像ディレクトリ選択</h2>
                        <p className="text-xs text-orange-600 mb-3 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
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

                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 pb-4">
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
                                disabled={!canStartProcessing || usersLoading}
                                className={`px-12 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto ${!canStartProcessing || usersLoading
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-xl'
                                    }`}
                            >
                                {usersLoading ? (
                                    <>
                                        <img src={spinner} alt="spinner" className="w-5 h-5 rounded-full" />
                                        ユーザーを読み込み中...
                                    </>
                                ) : !selectedUser ? (
                                    <>
                                        <User className="w-5 h-5" />
                                        作業者を選択してください
                                    </>
                                ) : selectedFiles.length === 0 ? (
                                    <>
                                        <FolderOpen className="w-5 h-5" />
                                        画像フォルダを選択してください
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
