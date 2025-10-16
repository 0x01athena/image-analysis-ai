import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, FolderOpen, Trophy, Play, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { uploadDirectoryImages, startBatchProcessing } from '../../api/batchApi';

const BatchProcessingPage = () => {
    const [directoryPath, setDirectoryPath] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [uploadSummary, setUploadSummary] = useState(null);
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

        try {
            // Upload images using API function
            const uploadResult = await uploadDirectoryImages(selectedFiles);
            console.log('Upload result:', uploadResult);

            // Store the sessionId from upload response
            if (uploadResult.success && uploadResult.data.sessionId) {
                setSessionId(uploadResult.data.sessionId);
                setUploadSummary(uploadResult.data.uploadSummary);
            } else {
                throw new Error('No session ID received from upload');
            }

            setIsUploading(false);
            setIsProcessing(true);

            // Start batch processing using API function with sessionId
            const processingResult = await startBatchProcessing(uploadResult.data.sessionId);
            console.log('Processing started:', processingResult);

            setIsProcessing(false);
        } catch (error) {
            console.error('Error starting batch processing:', error);
            alert('バッチ処理の開始に失敗しました: ' + error.message);
            setIsUploading(false);
            setIsProcessing(false);
        }
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

                    {/* Image Directory Selection Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">画像ディレクトリ選択</h2>
                        <p className="text-sm text-gray-600 mb-2">商品画像が保存されているフォルダを選択してください</p>

                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={directoryPath}
                                onChange={(e) => setDirectoryPath(e.target.value)}
                                placeholder="選択されたディレクトリ名"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                readOnly
                                onClick={handleDirectorySelect}
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

                    {/* Upload Summary Section */}
                    {uploadSummary && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">アップロード結果</h2>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{uploadSummary.newProducts}</div>
                                        <div className="text-sm text-blue-800">新規商品</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{uploadSummary.updatedProducts}</div>
                                        <div className="text-sm text-green-800">更新商品</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{uploadSummary.newImages}</div>
                                        <div className="text-sm text-purple-800">新規画像</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{uploadSummary.duplicateImages}</div>
                                        <div className="text-sm text-orange-800">重複画像</div>
                                    </div>
                                </div>

                                {uploadSummary.details.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">詳細情報</h3>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {uploadSummary.details.map((detail, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                                    <span className="font-medium">{detail.managementNumber}</span>
                                                    <div className="flex gap-4 text-xs">
                                                        <span className={`px-2 py-1 rounded ${detail.status === 'new' ? 'bg-green-100 text-green-800' :
                                                            detail.status === 'updated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {detail.status === 'new' ? '新規' :
                                                                detail.status === 'updated' ? '更新' : '変更なし'}
                                                        </span>
                                                        <span>既存: {detail.existingImages}</span>
                                                        <span>新規: {detail.newImages}</span>
                                                        <span>重複: {detail.duplicates}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
