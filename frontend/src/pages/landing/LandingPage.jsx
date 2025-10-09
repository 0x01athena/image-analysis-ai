import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Image, Zap, BarChart3 } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 to-blue-50 pt-32">
            {/* Hero Section */}
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                            AI出品タイトル生成
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        高度なAI技術で商品画像から詳細な情報を抽出し、魅力的なタイトルを自動生成します。
                        データ抽出からワークフロー最適化まで、すべてを効率化します。
                    </p>
                    <Link to="/image-upload">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                        >
                            始める
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                            <Image className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">スマート画像アップロード</h3>
                        <p className="text-gray-600">
                            ドラッグ&ドロップ機能で最大10枚の商品画像をアップロード。
                            複数の形式をサポートし、即座にフィードバックを提供します。
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                            <Zap className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">AIタイトル生成</h3>
                        <p className="text-gray-600">
                            高度なAIアルゴリズムを使用して魅力的な商品タイトルを自動生成。
                            最適な結果を得るために設定をカスタマイズできます。
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                            <BarChart3 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">一括処理</h3>
                        <p className="text-gray-600">
                            一括処理機能で複数の画像を同時に処理。
                            簡単な統合のために様々な形式で結果をエクスポートできます。
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
