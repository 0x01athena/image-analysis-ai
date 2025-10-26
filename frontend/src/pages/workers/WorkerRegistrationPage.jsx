import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {  Edit2, Trash2, Save, X, Users, UserPlus, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { createUser, getAllUsers, updateUser, deleteUser, deleteMultipleUsers } from '../../api/userApi';

const WorkerRegistrationPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ username: '' });
    const [formErrors, setFormErrors] = useState({});

    // Filter states
    const [filters, setFilters] = useState({
        dateRange: '', // 'today', 'week', 'month', 'custom'
        customStartDate: '',
        customEndDate: '',
        sortBy: 'username', // 'username', 'createdAt', 'updatedAt'
        sortOrder: 'asc' // 'asc', 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Load users on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await getAllUsers();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('ユーザーの読み込みに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort users
    const filteredUsers = users
        .filter(user => {
            // Search filter
            const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());

            // Date range filter
            let matchesDateRange = true;
            if (filters.dateRange) {
                const userDate = new Date(user.createdAt);
                const now = new Date();

                switch (filters.dateRange) {
                    case 'today':
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        matchesDateRange = userDate >= today;
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDateRange = userDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        matchesDateRange = userDate >= monthAgo;
                        break;
                    case 'custom':
                        if (filters.customStartDate && filters.customEndDate) {
                            const startDate = new Date(filters.customStartDate);
                            const endDate = new Date(filters.customEndDate);
                            endDate.setHours(23, 59, 59, 999); // Include the entire end date
                            matchesDateRange = userDate >= startDate && userDate <= endDate;
                        }
                        break;
                }
            }

            return matchesSearch && matchesDateRange;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (filters.sortBy) {
                case 'username':
                    aValue = a.username.toLowerCase();
                    bValue = b.username.toLowerCase();
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'updatedAt':
                    aValue = new Date(a.updatedAt);
                    bValue = new Date(b.updatedAt);
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (filters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Form validation
    const validateForm = () => {
        const errors = {};
        if (!formData.username.trim()) {
            errors.username = 'ユーザー名は必須です';
        } else if (formData.username.trim().length < 2) {
            errors.username = 'ユーザー名は2文字以上である必要があります';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (editingUser) {
                // Update existing user
                await updateUser(editingUser.id, formData);
                alert('ユーザーが正常に更新されました');
            } else {
                // Create new user
                await createUser(formData);
                alert('ユーザーが正常に作成されました');
            }

            // Reset form and reload users
            setFormData({ username: '' });
            setFormErrors({});
            setShowAddForm(false);
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('エラーが発生しました: ' + error.message);
        }
    };

    // Handle edit user
    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({ username: user.username });
        setShowAddForm(true);
        setFormErrors({});
    };

    // Handle delete single user
    const handleDelete = async (user) => {
        if (!confirm(`ユーザー "${user.username}" を削除してもよろしいですか？`)) {
            return;
        }

        try {
            await deleteUser(user.id);
            alert('ユーザーが正常に削除されました');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('エラーが発生しました: ' + error.message);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedUsers.size === 0) {
            alert('削除するユーザーを選択してください');
            return;
        }

        if (!confirm(`選択された ${selectedUsers.size} 人のユーザーを削除してもよろしいですか？`)) {
            return;
        }

        try {
            setDeleting(true);
            const response = await deleteMultipleUsers(Array.from(selectedUsers));

            if (response.data.failed.length > 0) {
                alert(`一部のユーザーの削除に失敗しました: ${response.data.failed.join(', ')}`);
            } else {
                alert('選択されたユーザーが正常に削除されました');
            }

            setSelectedUsers(new Set());
            loadUsers();
        } catch (error) {
            console.error('Error deleting users:', error);
            alert('エラーが発生しました: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
        } else {
            setSelectedUsers(new Set());
        }
    };

    // Handle select single user
    const handleSelectUser = (userId, checked) => {
        const newSelected = new Set(selectedUsers);
        if (checked) {
            newSelected.add(userId);
        } else {
            newSelected.delete(userId);
        }
        setSelectedUsers(newSelected);
    };

    // Cancel form
    const handleCancel = () => {
        setFormData({ username: '' });
        setFormErrors({});
        setShowAddForm(false);
        setEditingUser(null);
    };

    // Filter handlers
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    const clearFilters = () => {
        setFilters({
            dateRange: '',
            customStartDate: '',
            customEndDate: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        setSearchTerm('');
    };

    const toggleSort = (column) => {
        if (filters.sortBy === column) {
            setFilters(prev => ({
                ...prev,
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
            }));
        } else {
            setFilters(prev => ({
                ...prev,
                sortBy: column,
                sortOrder: 'asc'
            }));
        }
    };

    return (
        <div className="min-h-full bg-gray-50">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">ワーカー登録管理</h1>
                            <p className="text-gray-600">ユーザーの登録・編集・削除を行います</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {selectedUsers.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-300"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>選択削除 ({selectedUsers.size})</span>
                            </button>
                        )}

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>新規登録</span>
                        </button>
                    </div>
                </div>

                {/* Search and Stats */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col space-y-4">
                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="ユーザー名で検索..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-300 ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span>フィルター</span>
                                </button>

                                {(searchTerm || filters.dateRange || filters.customStartDate || filters.customEndDate) && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-300"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>クリア</span>
                                    </button>
                                )}
                            </div>

                            <div className="text-sm text-gray-600">
                                総ユーザー数: {users.length} | 表示中: {filteredUsers.length}
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-gray-200 pt-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Date Range Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            登録日でフィルター
                                        </label>
                                        <select
                                            value={filters.dateRange}
                                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">すべて</option>
                                            <option value="today">今日</option>
                                            <option value="week">過去1週間</option>
                                            <option value="month">過去1ヶ月</option>
                                            <option value="custom">カスタム</option>
                                        </select>
                                    </div>

                                    {/* Custom Date Range */}
                                    {filters.dateRange === 'custom' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    開始日
                                                </label>
                                                <input
                                                    type="date"
                                                    value={filters.customStartDate}
                                                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    終了日
                                                </label>
                                                <input
                                                    type="date"
                                                    value={filters.customEndDate}
                                                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Sort Options */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            並び順
                                        </label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={filters.sortBy}
                                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="createdAt">登録日</option>
                                                <option value="updatedAt">更新日</option>
                                                <option value="username">ユーザー名</option>
                                            </select>
                                            <button
                                                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                                            >
                                                {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Form */}
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-sm p-6 mb-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {editingUser ? 'ユーザー編集' : '新規ユーザー登録'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ユーザー名 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.username ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="ユーザー名を入力してください"
                                />
                                {formErrors.username && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-4">
                                <button
                                    type="submit"
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{editingUser ? '更新' : '登録'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-300"
                                >
                                    <X className="w-4 h-4" />
                                    <span>キャンセル</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">読み込み中...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                                {searchTerm ? '検索条件に一致するユーザーが見つかりません' : 'ユーザーが登録されていません'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('username')}
                                                className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-300"
                                            >
                                                <span>ユーザー名</span>
                                                {filters.sortBy === 'username' && (
                                                    filters.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('createdAt')}
                                                className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-300"
                                            >
                                                <span>登録日時</span>
                                                {filters.sortBy === 'createdAt' && (
                                                    filters.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('updatedAt')}
                                                className="flex items-center space-x-1 hover:text-gray-700 transition-colors duration-300"
                                            >
                                                <span>更新日時</span>
                                                {filters.sortBy === 'updatedAt' && (
                                                    filters.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.updatedAt).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors duration-300"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="text-red-600 hover:text-red-900 transition-colors duration-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkerRegistrationPage;
