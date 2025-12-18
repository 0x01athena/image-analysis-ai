import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { isSameJSTDate, getJSTDate } from '../utils/dateUtils';

const prisma = new PrismaClient();

export interface ProductImages {
    [productId: string]: string[];
}

export interface ProductData {
    managementNumber: string;
    images: string[];
    title?: string | null;
    candidateTitles?: string[] | null;
    level?: string | null;
    measurement?: string | null;
    measurementType?: string | null;
    condition?: string | null;
    category?: string | null;
    categoryList?: string[] | null;
    type?: string | null;
    shop1?: string | null;
    shop2?: string | null;
    shop3?: string | null;
    price?: number | null;
    imageReference?: string | null;
    packagingSize?: string | null;
    season?: string | null;
    accessories?: string | null;
    userId?: string | null;
}

export class ProductService {
    /**
     * Save products to database from product images mapping with duplicate detection
     * @param productImages - Mapping of management numbers to image arrays
     * @param price - Optional price to set for products
     * @param folderId - Optional folder ID to link products to
     */
    async saveProductsFromImages(productImages: ProductImages, price?: number | null, folderId?: string | null): Promise<any[]> {
        const savedProducts = [];

        for (const [managementNumber, newImages] of Object.entries(productImages)) {
            try {
                // Always create new product - even if products with same management number exist
                // Each product has a unique id, so duplicates are allowed
                const processedNewImages = await this.handleDuplicateFiles(managementNumber, newImages);

                // Create new product with JST timestamp
                const newProduct = await prisma.product.create({
                    data: {
                        managementNumber,
                        images: JSON.stringify(processedNewImages),
                        title: null,
                        candidateTitles: "[]",
                        level: null,
                        measurement: null,
                        condition: null,
                        category: null,
                        shop1: null,
                        shop2: null,
                        shop3: null,
                        price: price !== undefined && price !== null ? price : null,
                        folderId: folderId || null,
                        accessories: '無<br>採寸はAIが1cm各の格子背景で行っております。',
                        createdAt: getJSTDate(),
                        updatedAt: getJSTDate()
                    }
                });
                savedProducts.push(newProduct);
            } catch (error) {
                console.error(`Error saving product ${managementNumber}:`, error);
            }
        }

        return savedProducts;
    }

    /**
     * Get upload summary with duplicate detection results
     */
    async getUploadSummary(productImages: ProductImages): Promise<{
        totalProducts: number;
        newProducts: number;
        totalImages: number;
        newImages: number;
        duplicateImages: number;
        details: Array<{
            managementNumber: string;
            status: 'new';
            newImages: number;
            duplicates: number;
        }>;
    }> {
        const summary = {
            totalProducts: Object.keys(productImages).length,
            newProducts: 0,
            totalImages: 0,
            newImages: 0,
            duplicateImages: 0,
            details: [] as Array<{
                managementNumber: string;
                status: 'new';
                newImages: number;
                duplicates: number;
            }>
        };

        for (const [managementNumber, newImages] of Object.entries(productImages)) {
            // All products will be created as new (even if same management number exists)
            const processedNewImages = await this.handleDuplicateFiles(managementNumber, newImages);
            summary.newProducts++;
            summary.totalImages += newImages.length;
            summary.newImages += processedNewImages.length;
            summary.duplicateImages += (newImages.length - processedNewImages.length);

            summary.details.push({
                managementNumber,
                status: 'new',
                newImages: processedNewImages.length,
                duplicates: newImages.length - processedNewImages.length
            });
        }

        return summary;
    }

    /**
     * Update product with processing results
     * Updates the most recently created product if multiple exist
     */
    async updateProductWithResults(managementNumber: string, data: Partial<ProductData>): Promise<any> {
        try {
            // Get the most recently created product with this management number
            const product = await prisma.product.findFirst({
                where: { managementNumber },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!product) {
                throw new Error(`Product with management number ${managementNumber} not found`);
            }

            const updateData: any = {
                updatedAt: new Date()
            };

            if (data.title !== undefined) updateData.title = data.title;
            if (data.candidateTitles !== undefined) updateData.candidateTitles = JSON.stringify(data.candidateTitles);
            if (data.level !== undefined) updateData.level = data.level;
            if (data.measurement !== undefined) updateData.measurement = data.measurement;
            if (data.measurementType !== undefined) updateData.measurementType = data.measurementType;
            if (data.condition !== undefined) updateData.condition = data.condition;
            if (data.category !== undefined) updateData.category = data.category;
            if (data.categoryList !== undefined) updateData.categoryList = JSON.stringify(data.categoryList);
            if (data.type !== undefined) updateData.type = data.type;
            if (data.shop1 !== undefined) updateData.shop1 = data.shop1;
            if (data.shop2 !== undefined) updateData.shop2 = data.shop2;
            if (data.shop3 !== undefined) updateData.shop3 = data.shop3;
            if (data.price !== undefined) updateData.price = data.price !== null ? parseFloat(data.price as any) : null;
            if (data.imageReference !== undefined) updateData.imageReference = data.imageReference;
            if (data.packagingSize !== undefined) updateData.packagingSize = data.packagingSize;
            if (data.season !== undefined) updateData.season = data.season;
            if (data.accessories !== undefined) updateData.accessories = data.accessories;
            if (data.userId !== undefined) updateData.userId = data.userId;

            const updatedProduct = await prisma.product.update({
                where: { id: product.id },
                data: updateData
            });

            return updatedProduct;
        } catch (error) {
            console.error(`Error updating product ${managementNumber}:`, error);
            throw error;
        }
    }

    /**
     * Get product by management number
     * Returns the most recently created product if multiple exist
     */
    async getProductByManagementNumber(managementNumber: string): Promise<any | null> {
        try {
            return await prisma.product.findFirst({
                where: { managementNumber },
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            console.error(`Error getting product ${managementNumber}:`, error);
            throw error;
        }
    }

    /**
     * Get all products
     */
    async getAllProducts(): Promise<any[]> {
        try {
            return await prisma.product.findMany({
                include: {
                    user: true,
                    folder: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting all products:', error);
            throw error;
        }
    }

    /**
     * Delete product by management number and associated images
     * Deletes the most recently created product if multiple exist
     */
    async deleteProduct(managementNumber: string): Promise<any> {
        try {
            // First, get the product to retrieve image filenames (most recent one)
            const product = await prisma.product.findFirst({
                where: { managementNumber },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!product) {
                throw new Error(`Product with management number ${managementNumber} not found`);
            }

            // Delete the product from database by id
            const deletedProduct = await prisma.product.delete({
                where: { id: product.id }
            });

            // Delete associated image files
            try {
                const images = JSON.parse(product.images as string || "[]");
                const imagesDir = path.join(__dirname, '../../public/images');

                for (const imageFilename of images) {
                    const imagePath = path.join(imagesDir, imageFilename);

                    // Check if file exists before attempting to delete
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                        console.log(`Deleted image file: ${imageFilename}`);
                    } else {
                        console.log(`Image file not found: ${imageFilename}`);
                    }
                }
            } catch (imageError) {
                console.error(`Error deleting image files for product ${managementNumber}:`, imageError);
                // Don't throw error here - product is already deleted from database
                // Log the error but continue with successful response
            }

            console.log(`Successfully deleted product ${managementNumber} and associated images`);
            return deletedProduct;
        } catch (error) {
            console.error(`Error deleting product ${managementNumber}:`, error);
            throw error;
        }
    }

    /**
     * Delete multiple products by management numbers and associated images
     */
    async deleteMultipleProducts(managementNumbers: string[]): Promise<{ deleted: string[], failed: string[] }> {
        const deleted: string[] = [];
        const failed: string[] = [];

        for (const managementNumber of managementNumbers) {
            try {
                await this.deleteProduct(managementNumber);
                deleted.push(managementNumber);
            } catch (error) {
                console.error(`Failed to delete product ${managementNumber}:`, error);
                failed.push(managementNumber);
            }
        }

        return { deleted, failed };
    }

    /**
     * Delete all products in a folder and their associated images
     */
    async deleteProductsByFolderId(folderId: string): Promise<{ deleted: number, failed: number }> {
        let deleted = 0;
        let failed = 0;

        try {
            // Get all products in this folder
            const products = await prisma.product.findMany({
                where: { folderId }
            });

            console.log(`Found ${products.length} products in folder ${folderId}`);

            // Delete each product and its images
            for (const product of products) {
                try {
                    // Delete associated image files
                    try {
                        const images = JSON.parse(product.images as string || "[]");
                        const imagesDir = path.join(__dirname, '../../public/images');

                        for (const imageFilename of images) {
                            const imagePath = path.join(imagesDir, imageFilename);

                            // Check if file exists before attempting to delete
                            if (fs.existsSync(imagePath)) {
                                fs.unlinkSync(imagePath);
                                console.log(`Deleted image file: ${imageFilename}`);
                            } else {
                                console.log(`Image file not found: ${imageFilename}`);
                            }
                        }
                    } catch (imageError) {
                        console.error(`Error deleting image files for product ${product.managementNumber}:`, imageError);
                        // Continue even if image deletion fails
                    }

                    // Delete the product from database by id
                    await prisma.product.delete({
                        where: { id: product.id }
                    });

                    deleted++;
                    console.log(`Deleted product ${product.managementNumber} (ID: ${product.id})`);
                } catch (error) {
                    failed++;
                    console.error(`Failed to delete product ${product.managementNumber} (ID: ${product.id}):`, error);
                }
            }

            console.log(`Successfully deleted ${deleted} products from folder ${folderId}, ${failed} failed`);
            return { deleted, failed };
        } catch (error) {
            console.error(`Error deleting products by folder ID ${folderId}:`, error);
            throw error;
        }
    }

    /**
     * Merge images with duplicate detection, maintaining sequence order
     */
    private mergeImagesWithDuplicateDetection(existingImages: string[], newImages: string[]): string[] {
        const merged = [...existingImages];
        const existingSet = new Set(existingImages);

        for (const newImage of newImages) {
            if (!existingSet.has(newImage)) {
                merged.push(newImage);
                existingSet.add(newImage);
            }
        }

        return merged;
    }

    /**
     * Check for duplicate files in the filesystem and handle them
     */
    async handleDuplicateFiles(managementNumber: string, newImageFilenames: string[]): Promise<string[]> {
        const imagesDir = path.join(__dirname, '../../public/images');
        const processedImages: string[] = [];

        for (const filename of newImageFilenames) {
            const filePath = path.join(imagesDir, filename);

            // Check if file exists
            if (fs.existsSync(filePath)) {
                // File already exists, check if it's a duplicate
                const existingProduct = await this.findProductByImage(filename);

                if (existingProduct && existingProduct.managementNumber === managementNumber) {
                    // Same product, same image - this is expected, keep it
                    processedImages.push(filename);
                } else if (existingProduct) {
                    // Different product has this image - this might be a duplicate
                    processedImages.push(filename);
                } else {
                    // File exists but not in database - orphaned file, keep it
                    processedImages.push(filename);
                }
            } else {
                // File doesn't exist, this shouldn't happen after upload, but handle it
                console.log(`Warning: Image ${filename} not found in filesystem`);
                processedImages.push(filename);
            }
        }

        return processedImages;
    }

    /**
     * Find which product owns a specific image
     */
    private async findProductByImage(imageFilename: string): Promise<any | null> {
        try {
            const products = await prisma.product.findMany();

            for (const product of products) {
                const images = JSON.parse(product.images as string || "[]");
                if (images.includes(imageFilename)) {
                    return product;
                }
            }

            return null;
        } catch (error) {
            console.error(`Error finding product for image ${imageFilename}:`, error);
            return null;
        }
    }

    /**
     * Select a title from candidate titles
     * Updates the most recently created product if multiple exist
     */
    async selectTitleFromCandidates(managementNumber: string, selectedTitle: string): Promise<any> {
        try {
            const product = await prisma.product.findFirst({
                where: { managementNumber },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!product) {
                throw new Error(`Product with management number ${managementNumber} not found`);
            }

            const candidateTitles = JSON.parse(product.candidateTitles as string || "[]");

            if (!candidateTitles.includes(selectedTitle)) {
                throw new Error(`Selected title "${selectedTitle}" is not in the candidate titles`);
            }

            const updatedProduct = await prisma.product.update({
                where: { id: product.id },
                data: {
                    title: selectedTitle,
                    updatedAt: new Date()
                }
            });

            return updatedProduct;
        } catch (error) {
            console.error(`Error selecting title for product ${managementNumber}:`, error);
            throw error;
        }
    }

    /**
     * Get candidate titles for a product
     * Returns titles from the most recently created product if multiple exist
     */
    async getCandidateTitles(managementNumber: string): Promise<string[]> {
        try {
            const product = await prisma.product.findFirst({
                where: { managementNumber },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!product) {
                throw new Error(`Product with management number ${managementNumber} not found`);
            }

            return JSON.parse(product.candidateTitles as string || "[]");
        } catch (error) {
            console.error(`Error getting candidate titles for product ${managementNumber}:`, error);
            throw error;
        }
    }

    /**
     * Compare two arrays for equality
     */
    private arraysEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
    }

    async getCategoryList(productId: string): Promise<string[] | null> {
        try {
            const product = await prisma.product.findFirst({
                where: { managementNumber: productId },
                select: { categoryList: true },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!product?.categoryList) {
                return null;
            }

            try {
                const categoryList = typeof product.categoryList === 'string'
                    ? JSON.parse(product.categoryList)
                    : product.categoryList;
                return Array.isArray(categoryList) ? categoryList : null;
            } catch (e) {
                return null;
            }
        } catch (error) {
            console.error('Error getting category list:', error);
            return null;
        }
    }

    async updateProductCategoryList(level: number, body: any): Promise<void> {
        try {
            const { productId } = body;

            if (!productId) {
                throw new Error('Product ID is required');
            }

            const product = await prisma.product.findFirst({
                where: { managementNumber: productId },
                select: { id: true, categoryList: true },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!product) {
                throw new Error(`Product with management number ${productId} not found`);
            }

            console.log('product', product?.categoryList, level);

            let categoryList = await JSON.parse(product?.categoryList as string);
            categoryList = await level === 1 ? [] : categoryList.slice(0, level);

            console.log('categoryList', categoryList);

            const currentCategory = body?.[level === 1 ? `category` : `category${level}`]

            if (!categoryList.includes(currentCategory)) {
                categoryList.push(currentCategory);

                // Update the product by id
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        categoryList: JSON.stringify(categoryList)
                    }
                });
            }
        } catch (error) {
            console.error('Error updating product category list:', error);
            throw error;
        }
    }

    /**
     * Export products to new Excel file - creates multiple sheets as specified
     * @param userId - Optional user ID (for export history tracking only, not used for filtering)
     * @param filters - Optional filter parameters (rank, date, worker, category, condition, search, folderId)
     */
    async exportProductsToExcel(userId?: string, filters?: {
        rank?: string;
        date?: string;
        worker?: string;
        category?: string;
        condition?: string;
        search?: string;
        folderId?: string;
    }): Promise<Buffer | ArrayBuffer> {
        try {
            // Build where clause (userId filter removed - export all filtered products)
            const whereClause: any = {};
            if (filters?.folderId) {
                whereClause.folderId = filters.folderId;
            }

            // Get products from database with user relation, filtered by folderId if provided (no userId filter)
            let products = await prisma.product.findMany({
                where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
                include: {
                    user: true,
                    folder: true
                },
                orderBy: { createdAt: 'desc' }
            });

            // Apply filters if provided
            if (filters) {
                let filteredProducts = products;

                if (filters.rank) {
                    filteredProducts = filteredProducts.filter((p: any) => p.level === filters.rank);
                }

                if (filters.date) {
                    // Filter by date using JST comparison
                    filteredProducts = filteredProducts.filter((p: any) => {
                        return isSameJSTDate(p.createdAt, filters.date as string);
                    });
                }

                if (filters.worker) {
                    filteredProducts = filteredProducts.filter((p: any) =>
                        p.user?.username === filters.worker
                    );
                }

                if (filters.category) {
                    filteredProducts = filteredProducts.filter((p: any) =>
                        p.category === filters.category
                    );
                }

                if (filters.condition) {
                    filteredProducts = filteredProducts.filter((p: any) =>
                        p.condition === filters.condition
                    );
                }

                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    filteredProducts = filteredProducts.filter((p: any) =>
                        p.title?.toLowerCase().includes(searchTerm) ||
                        p.managementNumber.toLowerCase().includes(searchTerm) ||
                        p.category?.toLowerCase().includes(searchTerm) ||
                        p.condition?.toLowerCase().includes(searchTerm)
                    );
                }

                products = filteredProducts;
            }

            const filterInfo = [];
            if (filters?.folderId) filterInfo.push(`folderId: ${filters.folderId}`);
            if (filters?.rank) filterInfo.push(`rank: ${filters.rank}`);
            if (filters?.date) filterInfo.push(`date: ${filters.date}`);
            if (filters?.worker) filterInfo.push(`worker: ${filters.worker}`);
            if (filters?.category) filterInfo.push(`category: ${filters.category}`);
            if (filters?.condition) filterInfo.push(`condition: ${filters.condition}`);
            if (filters?.search) filterInfo.push(`search: ${filters.search}`);

            console.log(`Found ${products.length} products for export${filterInfo.length > 0 ? ` (filtered by ${filterInfo.join(', ')})` : ''}`);

            if (products.length === 0) {
                console.log('No products found in database');
            }

            // Create a new workbook
            const workbook = new ExcelJS.Workbook();

            // Create blank sheets first (except Sheet1)
            const blankSheetNames = [
                'csv',
                'category',
                'ブランド一覧',
                'csv2',
                'main',
                'コンディションランク',
                '出品ID',
                '金額レート'
            ];

            for (const sheetName of blankSheetNames) {
                workbook.addWorksheet(sheetName);
            }

            // Create Sheet1 with product data
            const sheet1 = workbook.addWorksheet('Sheet1');

            // Add header row
            const headers = [
                'カテゴリ', '管理番号', 'タイトル', '付属品', 'ラック', 'ランク', '型番', 'コメント',
                '仕立て・収納', '素材', '色', 'サイズ', 'トップス', 'パンツ', 'スカート', 'ワンピース',
                'スカートスーツ', 'パンツスーツ', '靴', 'ブーツ', 'スニーカー', 'ベルト', 'ネクタイ縦横',
                '帽子', 'バッグ', 'ネックレス', 'サングラス', 'あまり', '出品日', '出品URL', '原価',
                '売値', '梱包サイズ', '仕入先', '仕入日', 'ID', 'ブランド', 'シリーズ名', '原産国'
            ];

            const headerRow = sheet1.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Helper function to get condition description
            const getConditionDescription = (condition: string | null): string => {
                if (!condition) return '';
                const conditionMap: { [key: string]: string } = {
                    '1': '新品',
                    '2': '未使用に近い',
                    '3': '目立った傷や汚れなし',
                    '4': 'やや傷や汚れあり',
                    '5': '傷や汚れあり',
                    '6': '全体的に状態が悪い'
                };
                return conditionMap[condition] || '';
            };

            // Add product data rows
            let rowCount = 0;
            for (const product of products) {
                try {
                    let foreignSize = '';
                    try {
                        if (product.measurementType) {
                            const measurementType = JSON.parse(product.measurementType as string);
                            foreignSize = measurementType.foreign || '';
                        }
                    } catch (e) {
                        console.log(`Error parsing measurementType for product ${product.managementNumber}:`, e);
                    }

                    const priceValue = product.price ? `${product.price}` : '0';
                    const productAny = product as any;
                    const final_title = `◇ ${productAny.season} ${product.title} E ${product.managementNumber}` || '';
                    const baseIndex = [
                        "カテゴリ", "管理番号", "タイトル", "属品", "ラック", "ランク", "型番", "コメント", "仕立て・収納", "素材", "色",
                        "サイズ", "トップス", "パンツ", "スカート", "ワンピース", "スカートスー", "パンツスーツ", "靴", "ブーツ", "スニーカー", "ベルト",
                        "ネクタイ縦横", "帽子", "バッグ", "ネックレス", "サングラス", "あまり", "出品日", "出品URL", "原価", "売値", "梱包サイズ",
                        "仕入先", "仕入日", "ID", "ブランド", "シリーズ名",
                        "原産国"
                    ].indexOf(productAny.type)
                    const base = baseIndex === 0 ? "M" :
                        baseIndex > 0 && baseIndex < 9 ? "W" :
                            baseIndex > 9 && baseIndex < 11 ? "S" : "B"

                    const row = [
                        product.category || '',                                     // カテゴリ
                        product.managementNumber || '',                             // 管理番号
                        final_title,                                                // タイトル
                        product.accessories || '無<br>採寸はAIが1cm各の格子背景で行っております。',      // 付属品
                        `ベース${base}/K`,                                                // ラック
                        product.condition || '',                                    // ランク
                        '',                                                         // 型番
                        getConditionDescription(product.condition),                 // コメント
                        '',                                                         // 仕立て・収納
                        productAny.imageReference || '',                            // 素材
                        product.title || '',                                        // 色
                        foreignSize,                                                // サイズ
                        product.type !== 'トップス' ? '着丈：cm　肩幅：cm　身幅：cm　袖丈：cm' : product.measurement ? product.measurement : '着丈：cm　肩幅：cm　身幅：cm　袖丈：cm',                                                         // トップス
                        product.type !== 'パンツ' ? '股上：cm　股下：cm　ウエスト：cm　もも幅：cm　裾幅：cm' : product.measurement ? product.measurement : '股上：cm　股下：cm　ウエスト：cm　もも幅：cm　裾幅：cm',                                                         // パンツ
                        product.type !== 'スカート' ? '着丈：cm　ウエスト：cm　ヒップ：cm' : product.measurement ? product.measurement : '着丈：cm　ウエスト：cm　ヒップ：cm',                                                         // スカート
                        product.type !== 'ワンピース' ? '着丈：cm　肩幅：cm　身幅：cm　ウエスト：cm　袖丈：cm' : product.measurement ? product.measurement : '着丈：cm　肩幅：cm　身幅：cm　ウエスト：cm　袖丈：cm',                                                         // ワンピース
                        product.type !== 'スカートスーツ' ? '【ジャケット】サイズ：　　着丈： cm　肩幅： cm　身幅： cm　袖丈： cm【スカート】サイズ：　　着丈： cm　ウエスト： cm　ヒップ： cm' : product.measurement ? product.measurement : '【ジャケット】サイズ：　　着丈： cm　肩幅： cm　身幅： cm　袖丈： cm【スカート】サイズ：　　着丈： cm　ウエスト： cm　ヒップ： cm',                                                         // スカートスーツ
                        product.type !== 'パンツスーツ' ? '【ジャケット】サイズ：　　着丈： cm　肩幅： cm　身幅： cm　袖丈： cm【パンツ】サイズ：　　股上： cm　股下： cm　ウエスト： cm　もも幅： cm　裾幅： cm' : product.measurement ? product.measurement : '【ジャケット】サイズ：　　着丈： cm　肩幅： cm　身幅： cm　袖丈： cm【パンツ】サイズ：　　股上： cm　股下： cm　ウエスト： cm　もも幅： cm　裾幅： cm',                                                         // パンツスーツ
                        product.type !== '靴' ? '底長： cm　底甲幅： cm　ヒール： cm' : product.measurement ? product.measurement : '底長： cm　底甲幅： cm　ヒール： cm',                                                         // 靴
                        product.type !== 'ブーツ' ? '底長： cm　底甲幅： cm　ヒール： cm　高さ： cm　足入れ口円周： cm' : product.measurement ? product.measurement : '底長： cm　底甲幅： cm　ヒール： cm　高さ： cm　足入れ口円周： cm',                                                         // ブーツ
                        product.type !== 'スニーカー' ? '底長： cm　底甲幅： cm　ヒール： cm' : product.measurement ? product.measurement : '底長： cm　底甲幅： cm　ヒール： cm',                                                         // スニーカー
                        product.type !== 'ベルト' ? '全長cm　幅cm 最短cm 間隔cm 穴' : product.measurement ? product.measurement : '全長cm　幅cm 最短cm 間隔cm 穴',                                                         // ベルト
                        product.type === 'ネックレス' ? product.measurement : '全長：約cm　最大幅：約cm',                                                         // ネクタイ縦横
                        product.type !== '帽子' ? '内周： cm　高さ： cm　つば： cm' : product.measurement ? product.measurement : '内周： cm　高さ： cm　つば： cm',                                                         // 帽子
                        product.type !== 'バッグ' ? '縦幅： cm　横幅： cm　マチ幅： cm　持ち手： cm' : product.measurement ? product.measurement : '縦幅： cm　横幅： cm　マチ幅： cm　持ち手： cm',                                                         // バッグ
                        product.type !== 'ネックレス' ? '全長： cm　トップ：縦幅： cm　横幅： cm ' : product.measurement ? product.measurement : '全長： cm　トップ：縦幅： cm　横幅： cm ',                                                         // ネックレス
                        product.type !== 'サングラス' ? 'レンズ幅縦横： xmm　フレーム幅： cm' : product.measurement ? product.measurement : 'レンズ幅縦横： xmm　フレーム幅： cm',                                                         // サングラス
                        '',                                                         // あまり
                        '',                                                         // 出品日
                        '',                                                         // 出品URL
                        '',                                                         // 原価
                        priceValue,                                                 // 売値
                        productAny.packagingSize || '通常',                         // 梱包サイズ
                        '0',                                                       // 仕入先
                        '0',                                                        // 仕入日
                        '1',                                                        // ID
                        '0',                                                        // ブランド
                        '',                                                         // シリーズ名
                        ''                                                          // 原産国
                    ];

                    let error = "";
                    if (row[1] === '') error = `${headers[1]}が空です。`;
                    if (row[2] === '') error = `${headers[2]}が空です。`;
                    if (row[3] === '') error = `${headers[3]}が空です。`;
                    if (row[4] === '') error = `${headers[4]}が空です。`;
                    if (row[5] === '') error = `${headers[5]}が空です。`;
                    if (row[7] === '') error = `${headers[7]}が空です。`;
                    if (row[9] === '') error = `${headers[9]}が空です。`;
                    if (row[10] === '') error = `${headers[10]}が空です。`;
                    if (row[12] === '') error = `${headers[12]}が空です。`;
                    if (row[13] === '') error = `${headers[13]}が空です。`;
                    if (row[14] === '') error = `${headers[14]}が空です。`;
                    if (row[15] === '') error = `${headers[15]}が空です。`;
                    if (row[16] === '') error = `${headers[16]}が空です。`;
                    if (row[17] === '') error = `${headers[17]}が空です。`;
                    if (row[18] === '') error = `${headers[18]}が空です。`;
                    if (row[19] === '') error = `${headers[19]}が空です。`;
                    if (row[20] === '') error = `${headers[20]}が空です。`;
                    if (row[21] === '') error = `${headers[21]}が空です。`;
                    if (row[22] === '') error = `${headers[22]}が空です。`;
                    if (row[23] === '') error = `${headers[23]}が空です。`;
                    if (row[24] === '') error = `${headers[24]}が空です。`;
                    if (row[25] === '') error = `${headers[25]}が空です。`;
                    if (row[26] === '') error = `${headers[26]}が空です。`;
                    if (row[31] === '' || row[31] === '0') error = `${headers[31]}が空です。`;
                    if (row[32] === '') error = `${headers[32]}が空です。`;
                    if (row[33] === '') error = `${headers[33]}が空です。`;
                    if (row[34] === '') error = `${headers[34]}が空です。`;
                    if (row[35] === '') error = `${headers[35]}が空です。`;
                    if (row[36] === '') error = `${headers[36]}が空です。`;

                    if (error !== "") {
                        const exportError: any = new Error(`管理番号: ${product.managementNumber}, 理由: ${error}`);
                        exportError.managementNumber = product.managementNumber;
                        throw exportError;
                    }

                    sheet1.addRow(row);
                    rowCount++;
                } catch (error) {
                    console.log(error);
                    throw error;
                }
            }

            while (rowCount < 819) {
                try {
                    const row = [
                        '',                                     // カテゴリ
                        '',                             // 管理番号
                        '◇ E',                                                // タイトル
                        '無<br>採寸はAIが1cm各の格子背景で行っております。',      // 付属品 (empty row default)
                        `ベースB`,                                                // ラック
                        '',                                    // ランク
                        '',                                                         // 型番
                        '',                 // コメント
                        '',                                                         // 仕立て・収納
                        '',                            // 素材
                        '',                                        // 色
                        '',                                                // サイズ
                        '着丈：cm　肩幅：cm　身幅：cm　袖丈：cm',                                                         // トップス
                        '股上：cm　股下：cm　ウエスト：cm　もも幅：cm　裾幅：cm',                                                         // パンツ
                        '着丈：cm　ウエスト：cm　ヒップ：cm',                                                         // スカート
                        '着丈：cm　肩幅：cm　身幅：cm　ウエスト：cm　袖丈：cm',                                                         // ワンピース
                        '【ジャケット】サイズ：　　着丈： cm　肩幅： cm　身幅： cm　袖丈： cm【スカート】サイズ：　　着丈： cm　ウエスト： cm　ヒップ： cm',                                                         // スカートスーツ
                        '【ジャケット】サイズ：　　着丈： cm　肩幅： cm　身幅： cm　袖丈： cm【パンツ】サイズ：　　股上： cm　股下： cm　ウエスト： cm　もも幅： cm　裾幅： cm',                                                         // パンツスーツ
                        '底長： cm　底甲幅： cm　ヒール： cm',                                                         // 靴
                        '底長： cm　底甲幅： cm　ヒール： cm　高さ： cm　足入れ口円周： cm',                                                         // ブーツ
                        '底長： cm　底甲幅： cm　ヒール： cm',                                                         // スニーカー
                        '全長cm　幅cm 最短cm 間隔cm 穴',                                                         // ベルト
                        '全長：約cm　最大幅：約cm',                                                         // ネクタイ縦横
                        '内周： cm　高さ： cm　つば： cm',                                                         // 帽子
                        '縦幅： cm　横幅： cm　マチ幅： cm　持ち手： cm',                                                         // バッグ
                        '全長： cm　トップ：縦幅： cm　横幅： cm ',                                                         // ネックレス
                        'レンズ幅縦横： xmm　フレーム幅： cm',                                                         // サングラス
                        '',                                                         // あまり
                        '',                                                         // 出品日
                        '',                                                         // 出品URL
                        '',                                                         // 原価
                        '¥0',                                                 // 売値
                        '通常',                         // 梱包サイズ
                        '¥0',                                                       // 仕入先
                        '0',                                                        // 仕入日
                        '1',                                                        // ID
                        '0',                                                        // ブランド
                        '',                                                         // シリーズ名
                        ''                                                          // 原産国
                    ];

                    sheet1.addRow(row);
                    rowCount++;
                } catch (error) {
                    console.error(`Error adding empty row:`, error);
                }
            }

            console.log(`Added ${rowCount} products to Sheet1 (out of ${products.length} total)`);

            const buffer = await workbook.xlsx.writeBuffer();

            console.log(`Successfully exported Excel file with product data`);
            return buffer;
        } catch (error) {
            console.error('Error exporting products to Excel:', error);
            throw error;
        }
    }
}

export const productService = new ProductService();
