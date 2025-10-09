import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Settings, Wifi, Save, RotateCcw, HelpCircle, Monitor, Smartphone } from 'lucide-react';

const ImageUploadPage = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [productInfo, setProductInfo] = useState({
        brand: '',
        modelNumber: '',
        size: '',
        hasMeasurementScale: true,
        additionalInfo: ''
    });
    const [settings, setSettings] = useState({
        backendUrl: 'http://162.43.19.70',
        characterCountRule: 50,
        macroOutputLimit: 100,
        categoryAutoSelection: true
    });

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        if (uploadedFiles.length + files.length <= 10) {
            setUploadedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        if (uploadedFiles.length + files.length <= 10) {
            setUploadedFiles(prev => [...prev, ...files]);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    return (
        <div className="min-h-full bg-gray-50 py-8">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Product Image Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-8 mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">商品画像</h2>
                    <p className="text-gray-600 mb-4">クリックまたはドラッグして画像をアップロード</p>
                    <p className="text-sm text-gray-500 mb-6">最大10枚まで選択可能</p>

                    <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors duration-300 cursor-pointer"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-2">クリックまたはドラッグして画像をアップロード</p>
                        <p className="text-sm text-gray-500 mb-6">最大10枚まで選択可能</p>
                        <button className="flex bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 items-center gap-2 mx-auto">
                            <Upload className="w-4 h-4" />
                            ファイルを選択
                        </button>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Uploaded Files Preview */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">アップロード済み画像 ({uploadedFiles.length}/10)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {uploadedFiles.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Upload ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Product Information Entry Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-8 mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">商品情報入力</h2>
                    <p className="text-gray-600 mb-6">既知の情報があれば入力してください (空欄可)</p>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ブランド</label>
                            <input
                                type="text"
                                placeholder="例:ユニクロ"
                                value={productInfo.brand}
                                onChange={(e) => setProductInfo(prev => ({ ...prev, brand: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">型番</label>
                            <input
                                type="text"
                                placeholder="例: ABC123"
                                value={productInfo.modelNumber}
                                onChange={(e) => setProductInfo(prev => ({ ...prev, modelNumber: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">サイズ</label>
                            <input
                                type="text"
                                placeholder="例: M, L, 38"
                                value={productInfo.size}
                                onChange={(e) => setProductInfo(prev => ({ ...prev, size: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="measurement-scale"
                                    checked={productInfo.hasMeasurementScale}
                                    onChange={(e) => setProductInfo(prev => ({ ...prev, hasMeasurementScale: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="measurement-scale" className="ml-3 text-sm text-gray-700">
                                    画像には測定スケールが含まれています
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">追加情報</label>
                        <textarea
                            placeholder="その他の商品情報があれば記入してください"
                            value={productInfo.additionalInfo}
                            onChange={(e) => setProductInfo(prev => ({ ...prev, additionalInfo: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                        />
                    </div>
                </motion.div>

                {/* Application Settings Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-6 h-6 text-gray-600" />
                        <h2 className="text-2xl font-bold text-gray-900">アプリケーション設定</h2>
                    </div>
                    <p className="text-gray-600 mb-8">AIタイトル生成システムの動作設定を変更できます</p>

                    <div className="space-y-6">
                        {/* Backend URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">バックエンドURL</label>
                            <div className="flex gap-3">
                                <input
                                    type="url"
                                    value={settings.backendUrl}
                                    onChange={(e) => setSettings(prev => ({ ...prev, backendUrl: e.target.value }))}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2">
                                    <Wifi className="w-4 h-4" />
                                    接続テスト
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">AIタイトル生成APIのエンドポイントURLを指定してください</p>
                        </div>

                        {/* Character Count Rule */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">文字数規定 (ランクA/B判定基準)</label>
                            <input
                                type="number"
                                value={settings.characterCountRule}
                                onChange={(e) => setSettings(prev => ({ ...prev, characterCountRule: parseInt(e.target.value) }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-2">この文字数以上のタイトルがランクA、未満がランクBになります (デフォルト:50文字)</p>
                        </div>

                        {/* Macro Output Limit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">マクロ出力件数上限</label>
                            <input
                                type="number"
                                value={settings.macroOutputLimit}
                                onChange={(e) => setSettings(prev => ({ ...prev, macroOutputLimit: parseInt(e.target.value) }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-2">CSV出力時の最大件数を指定してください (デフォルト:100件)</p>
                        </div>

                        {/* Category Auto-selection */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="category-auto"
                                checked={settings.categoryAutoSelection}
                                onChange={(e) => setSettings(prev => ({ ...prev, categoryAutoSelection: e.target.checked }))}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="category-auto" className="ml-3 text-sm font-medium text-gray-700">
                                カテゴリ自動選択
                            </label>
                        </div>
                        <p className="text-sm text-gray-500 -mt-4">有効にすると、タイトル文字からカテゴリを自動で選択します</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            設定を保存
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            デフォルトに戻す
                        </button>
                    </div>

                    {/* Help Section */}
                    <div className="mt-8 py-4 px-6 border border-blue-300 bg-blue-100 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <HelpCircle className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">ヘルプ</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>• 設定はアプリケーション終了時に自動で保存されます</li>
                            <li>• バックエンドURLが正しくない場合、タイトル生成に失敗します</li>
                            <li>• 文字数規定は商品の特性に合わせて調整してください</li>
                            <li>• デスクトップ版では設定ファイルが永続化されます</li>
                        </ul>
                    </div>

                    {/* System Information */}
                    <div className="mt-4 py-4 px-6 border border-green-300 bg-green-100 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Monitor className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">システム情報</h3>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>実行環境: デスクトップ版</div>
                            <div>バージョン: 1.0.0</div>
                            <div>プラットフォーム: win32</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ImageUploadPage;
