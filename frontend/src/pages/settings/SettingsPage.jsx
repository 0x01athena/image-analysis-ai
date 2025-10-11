import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Wifi, Save, RotateCcw, HelpCircle, Monitor } from 'lucide-react';
import { BACKEND_URL } from '../../api/config';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        backendUrl: BACKEND_URL,
        characterCountRule: 50,
        macroOutputLimit: 100,
        categoryAutoSelection: true
    });

    return (
        <div className="min-h-full bg-gray-50 py-8">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Application Settings Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-6 h-6 text-gray-600" />
                        <h2 className="text-2xl font-bold text-gray-900">アプリケーション設定</h2>
                    </div>
                    <p className="text-gray-600 mb-8">AIタイトル生成システムの動作設定を変更できます</p>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
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

export default SettingsPage;
