import { Request, Response } from 'express';
import { productService, ProductImages } from '../services/ProductService';
import { openAIService, OpenAIProductAnalysis } from '../services/OpenAIService';
import { workProcessService } from '../services/WorkProcessService';
import { userService } from '../services/UserService';
import { categoryService } from '../services/CategoryService';
import { excelExportHistoryService } from '../services/ExcelExportHistoryService';
import { folderService } from '../services/FolderService';
import { isSameJSTDate, getJSTDate } from '../utils/dateUtils';



class BatchController {
    /**
     * Upload images from directory and group by product ID
     */
    uploadDirectoryImages = async (req: Request, res: Response): Promise<void> => {
        try {
            // Handle upload errors from middleware (e.g., file size limits)
            const uploadErrors = (req as any).uploadErrors;
            if (uploadErrors && uploadErrors.length > 0) {
                console.log('Upload errors detected:', uploadErrors);
            }

            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No images provided',
                    uploadErrors: uploadErrors || []
                });
                return;
            }

            const uploadedFiles = req.files as Express.Multer.File[];
            const productImages: ProductImages = {};
            const skippedFiles: Array<{ filename: string, reason: string, size?: number }> = [];
            const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

            // Group images by product ID (extracted from filename) and check file sizes
            uploadedFiles.forEach(file => {
                // Check file size
                if (file.size > MAX_FILE_SIZE) {
                    skippedFiles.push({
                        filename: file.originalname,
                        reason: 'File too large',
                        size: file.size
                    });
                    console.log(`Skipping file ${file.originalname} - size ${file.size} exceeds 1MB limit`);
                    return; // Skip this file
                }

                // Handle both regular uploads and directory uploads
                let filename = file.originalname;

                // If it's a directory upload, extract just the filename from the path
                if (filename.includes('/')) {
                    filename = filename.split('/').pop() || filename;
                }

                const productId = filename.split('_')[0];

                if (productId && filename.includes('_')) {
                    if (!productImages[productId]) {
                        productImages[productId] = [];
                    }
                    productImages[productId].push(file.filename);
                } else {
                    skippedFiles.push({
                        filename: file.originalname,
                        reason: 'Invalid filename pattern'
                    });
                    console.log(`Skipping file ${filename} - doesn't match expected pattern`);
                }
            });

            // Check if we have any valid files to process
            if (Object.keys(productImages).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No valid images to process',
                    skippedFiles: skippedFiles
                });
                return;
            }

            // Get upload summary before saving
            const uploadSummary = await productService.getUploadSummary(productImages);

            // Get price, userId, and folderName from request body
            const { userId, price, folderName } = req.body;
            const priceValue = price !== undefined && price !== null ? parseFloat(price as string) : null;

            // Validate user ID
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            // Verify user exists
            const user = await userService.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Create or get folder if folderName is provided
            let folderId: string | null = null;
            if (folderName && folderName.trim()) {
                const folder = await folderService.createOrGetFolder({
                    userId,
                    foldername: folderName.trim()
                });
                folderId = folder.id;
            }

            // Save products to database with folderId
            const savedProducts = await productService.saveProductsFromImages(productImages, priceValue, folderId);

            // Update folder product count if folder exists
            if (folderId) {
                await folderService.updateProductCount(folderId);
            }

            // Create work process record
            const productIds = Object.keys(productImages);
            const workProcess = await workProcessService.createWorkProcess({
                userId,
                productIds
            });

            const totalProducts = Object.keys(productImages).length;
            const totalImages = uploadedFiles.length;

            res.status(200).json({
                success: true,
                message: 'Images uploaded successfully',
                data: {
                    workProcessId: workProcess.id,
                    userId,
                    totalImages,
                    totalProducts,
                    savedProducts,
                    skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
                    uploadErrors: uploadErrors || [],
                    uploadSummary: {
                        newProducts: uploadSummary.newProducts,
                        updatedProducts: uploadSummary.updatedProducts,
                        newImages: uploadSummary.newImages,
                        duplicateImages: uploadSummary.duplicateImages,
                        details: uploadSummary.details
                    },
                    productGroups: Object.keys(productImages).map(productId => ({
                        productId,
                        imageCount: productImages[productId].length,
                        images: productImages[productId]
                    }))
                }
            });

        } catch (error) {
            console.error('Error uploading images:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload images',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Start batch processing for uploaded images
     */
    startBatchProcessing = async (req: Request, res: Response): Promise<void> => {
        try {
            // Handle case where req.body might be undefined
            const body = req.body || {};
            const { workProcessId } = body;

            if (!workProcessId) {
                res.status(400).json({
                    success: false,
                    message: 'Work Process ID is required in request body'
                });
                return;
            }

            // Get work process to verify it exists and get product IDs
            const workProcess = await workProcessService.getWorkProcessById(workProcessId);
            if (!workProcess) {
                res.status(404).json({
                    success: false,
                    message: 'Work process not found or expired'
                });
                return;
            }

            if (workProcess.isFinished) {
                res.status(400).json({
                    success: false,
                    message: 'Work process is already completed'
                });
                return;
            }

            const productIds = workProcess.productIds;
            console.log('Starting batch processing for work process:', workProcessId, 'Products:', productIds);

            // Start processing in background
            this.processProductsAsync(workProcessId, productIds);

            res.status(200).json({
                success: true,
                message: 'Batch processing started',
                data: {
                    workProcessId,
                    totalProducts: productIds.length,
                    startTime: getJSTDate()
                }
            });

        } catch (error) {
            console.error('Error starting batch processing:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start batch processing',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };


    /**
     * Process products asynchronously (single thread simulation)
     */
    private async processProductsAsync(workProcessId: string, productIds: string[]) {
        console.log('Processing products for work process:', workProcessId, 'Products:', productIds);

        // Get work process to get userId
        const workProcess = await workProcessService.getWorkProcessById(workProcessId);
        if (!workProcess) {
            console.error('Work process not found:', workProcessId);
            return;
        }

        const userId = workProcess.userId;

        for (const productId of productIds) {
            try {
                // Update current product being processed
                await workProcessService.updateCurrentProduct(workProcessId, productId);
                console.log(`Now processing product: ${productId}`);

                // Get product images from database
                const product = await productService.getProductByManagementNumber(productId);
                if (!product) {
                    console.log(`Product ${productId} not found, skipping`);
                    continue;
                }

                const images = JSON.parse(product.images as string || "[]");
                if (images.length === 0) {
                    console.log(`Product ${productId} has no images, skipping`);
                    continue;
                }

                const startTime = Date.now();
                const result = await this.processSingleProduct(productId, images, userId);
                const processingTime = Date.now() - startTime;

                console.log(`Completed processing product ${productId} in ${processingTime}ms`);

                // Increment finished products count
                await workProcessService.incrementFinishedProducts(workProcessId);

            } catch (error) {
                console.error(`Error processing product ${productId}:`, error);
                // Still increment finished products even if there was an error
                await workProcessService.incrementFinishedProducts(workProcessId);
            }

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Mark work process as finished
        try {
            await workProcessService.markWorkProcessFinished(workProcessId);
            console.log(`Work process ${workProcessId} marked as finished`);
        } catch (error) {
            console.error(`Error marking work process finished for work process ${workProcessId}:`, error);
        }

        console.log('Batch processing completed for work process:', workProcessId);
    }

    /**
     * Process a single product using OpenAI Vision API
     */
    private async processSingleProduct(productId: string, images: string[], userId: string): Promise<void> {
        try {
            console.log(`Processing product ${productId} with ${images.length} images using OpenAI...`);

            // Call OpenAI to analyze the product images
            const analysis: OpenAIProductAnalysis = await openAIService.analyzeProductImages(productId, images);

            console.log(`OpenAI analysis for product ${productId}:`, analysis);

            // Determine imageReference based on product type
            const typeArray = [
                "カテゴリ", "管理番号", "タイトル", "属品", "ラック", "ランク", "型番", "コメント", "仕立て・収納", "素材", "色",
                "サイズ", "トップス", "パンツ", "スカート", "ワンピース", "スカートスー", "パンツスーツ", "靴", "ブーツ", "スニーカー", "ベルト",
                "ネクタイ縦横", "帽子", "バッグ", "ネックレス", "サングラス", "あまり", "出品日", "出品URL", "原価", "売値", "梱包サイズ",
                "仕入先", "仕入日", "ID", "ブランド", "シリーズ名", "原産国"
            ];

            const typeIndex = typeArray.indexOf(analysis.type || '');
            const imageReference = (typeIndex > 9 && typeIndex < 11) ? "/ソール" : "画像参照";

            // Update the product in the database with the analysis results
            await productService.updateProductWithResults(productId, {
                managementNumber: productId,
                images: images,
                title: analysis.title[0] || '', // Use first title as default
                candidateTitles: analysis.title, // Store all candidate titles
                level: analysis.level,
                measurement: analysis.measurement,
                measurementType: analysis.measurement_type ? JSON.stringify(analysis.measurement_type) : null, // Convert object to JSON string
                condition: analysis.condition,
                category: analysis.category,
                categoryList: analysis.categoryList || [], // Store category list from OpenAI
                type: analysis.type,
                season: analysis.season,
                imageReference: imageReference,
                shop1: analysis.shop1,
                shop2: analysis.shop2,
                shop3: analysis.shop3,
                userId: userId
            });

        } catch (error) {
            console.error(`Error processing product ${productId} with OpenAI:`, error);

            // If OpenAI fails, set default values
            await productService.updateProductWithResults(productId, {
                managementNumber: productId,
                images: images,
                title: `商品 ${productId}`,
                candidateTitles: [`商品 ${productId}`],
                level: 'C',
                measurement: '測定不可',
                condition: '状態不明',
                category: '未分類',
                userId: userId
            });
        }
    }


    /**
     * Get all products with pagination and filtering
     */
    getAllProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const { page = 1, limit = 50, rank, date, worker, category, condition, search, folderId } = req.query;

            let products = await productService.getAllProducts();

            // Apply filters
            let filteredProducts = products;

            if (rank) {
                filteredProducts = filteredProducts.filter((p: any) => p.level === rank);
            }

            if (date) {
                // Filter by date using JST comparison
                filteredProducts = filteredProducts.filter((p: any) => {
                    return isSameJSTDate(p.createdAt, date as string);
                });
            }

            if (worker) {
                filteredProducts = filteredProducts.filter((p: any) =>
                    p.user?.username === worker
                );
            }

            if (category) {
                filteredProducts = filteredProducts.filter((p: any) =>
                    p.category === category
                );
            }

            if (condition) {
                filteredProducts = filteredProducts.filter((p: any) =>
                    p.condition === condition
                );
            }

            if (search) {
                const searchTerm = (search as string).toLowerCase();
                filteredProducts = filteredProducts.filter((p: any) =>
                    p.title?.toLowerCase().includes(searchTerm) ||
                    p.managementNumber.toLowerCase().includes(searchTerm) ||
                    p.category?.toLowerCase().includes(searchTerm) ||
                    p.condition?.toLowerCase().includes(searchTerm)
                );
            }

            if (folderId) {
                filteredProducts = filteredProducts.filter((p: any) =>
                    p.folderId === folderId
                );
            }

            // Apply pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

            res.status(200).json({
                success: true,
                data: {
                    products: paginatedProducts,
                    total: filteredProducts.length,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(filteredProducts.length / Number(limit))
                }
            });

        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get single product by management number
     */
    getProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { managementNumber } = req.params;

            const product = await productService.getProductByManagementNumber(managementNumber);

            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: product
            });

        } catch (error) {
            console.error('Error getting product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Update product
     */
    updateProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { managementNumber } = req.params;
            const updateData = req.body;

            const updatedProduct = await productService.updateProductWithResults(managementNumber, updateData);

            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });

        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Delete product
     */
    deleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { managementNumber } = req.params;

            await productService.deleteProduct(managementNumber);

            res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get candidate titles for a product
     */
    getCandidateTitles = async (req: Request, res: Response): Promise<void> => {
        try {
            const { managementNumber } = req.params;

            const candidateTitles = await productService.getCandidateTitles(managementNumber);

            res.status(200).json({
                success: true,
                data: {
                    managementNumber,
                    candidateTitles
                }
            });

        } catch (error) {
            console.error('Error getting candidate titles:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get candidate titles',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Select a title from candidate titles
     */
    selectTitle = async (req: Request, res: Response): Promise<void> => {
        try {
            const { managementNumber } = req.params;
            const { selectedTitle } = req.body;

            if (!selectedTitle) {
                res.status(400).json({
                    success: false,
                    message: 'selectedTitle is required'
                });
                return;
            }

            const updatedProduct = await productService.selectTitleFromCandidates(managementNumber, selectedTitle);

            res.status(200).json({
                success: true,
                message: 'Title selected successfully',
                data: updatedProduct
            });

        } catch (error) {
            console.error('Error selecting title:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to select title',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Delete multiple products
     */
    deleteMultipleProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const { managementNumbers } = req.body;

            if (!Array.isArray(managementNumbers) || managementNumbers.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'managementNumbers must be a non-empty array'
                });
                return;
            }

            const result = await productService.deleteMultipleProducts(managementNumbers);

            res.status(200).json({
                success: true,
                message: `Deleted ${result.deleted.length} products successfully`,
                data: {
                    deleted: result.deleted,
                    failed: result.failed,
                    totalRequested: managementNumbers.length,
                    totalDeleted: result.deleted.length,
                    totalFailed: result.failed.length
                }
            });

        } catch (error) {
            console.error('Error deleting multiple products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get all users
     */
    getAllUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await userService.getAllUsers();

            res.status(200).json({
                success: true,
                data: users
            });

        } catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get users',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get work process status by session ID
     */
    getWorkProcessStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { workProcessId } = req.params;

            if (!workProcessId) {
                res.status(400).json({
                    success: false,
                    message: 'Work Process ID is required'
                });
                return;
            }

            const workProcess = await workProcessService.getWorkProcessById(workProcessId);
            if (!workProcess) {
                res.status(404).json({
                    success: false,
                    message: 'Work process not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: workProcess
            });

        } catch (error) {
            console.error('Error getting work process status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get work process status',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Mark work process as finished
     */
    markWorkProcessFinished = async (req: Request, res: Response): Promise<void> => {
        try {
            const { workProcessId } = req.params;

            if (!workProcessId) {
                res.status(400).json({
                    success: false,
                    message: 'Work Process ID is required'
                });
                return;
            }

            const workProcess = await workProcessService.markWorkProcessFinished(workProcessId);

            res.status(200).json({
                success: true,
                message: 'Work process marked as finished',
                data: workProcess
            });

        } catch (error) {
            console.error('Error marking work process as finished:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark work process as finished',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get active work processes for a user
     */
    getActiveWorkProcesses = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            const workProcesses = await workProcessService.getActiveWorkProcessesByUser(userId);

            res.status(200).json({
                success: true,
                data: workProcesses
            });

        } catch (error) {
            console.error('Error getting active work processes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get active work processes',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get category list for a product
     */
    getProductCategoryList = async (req: Request, res: Response): Promise<void> => {
        try {
            const { productId } = req.params;

            if (!productId) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
                return;
            }

            const categoryList = await productService.getCategoryList(productId);

            res.status(200).json({
                success: true,
                data: categoryList
            });
        } catch (error) {
            console.error('Error getting product category list:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product category list',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get top-level categories
     */
    getTopLevelCategories = async (req: Request, res: Response): Promise<void> => {
        try {
            const categories = await categoryService.getTopLevelCategories();

            res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error getting top-level categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get top-level categories',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get categories by level
     */
    getCategoriesByLevel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { level } = req.params;
            const { category, category2, category3, category4, category5, category6, category7 } = req.body;

            const levelNum = parseInt(level);
            if (isNaN(levelNum) || levelNum < 2 || levelNum > 8) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid level. Must be between 2 and 8'
                });
                return;
            }
            console.log('req.body', req.body, level);

            await productService.updateProductCategoryList(levelNum - 1, req.body);

            const categories = await categoryService.getCategoriesByLevel(
                levelNum,
                category as string,
                category2 as string,
                category3 as string,
                category4 as string,
                category5 as string,
                category6 as string,
                category7 as string
            );

            res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error getting categories by level:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get categories',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Export products to new Excel file - creates トップス tab with 管理番号 and 色 columns
     */
    exportExcelFile = async (req: Request, res: Response): Promise<void> => {
        try {
            // Get userId from request body or query
            const userId = (req.body?.userId || req.query?.userId) as string;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            // Verify user exists
            const user = await userService.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Get filter parameters from query
            const { rank, date, worker, category, condition, search, folderId } = req.query;

            // Build filters object
            const filters: {
                rank?: string;
                date?: string;
                worker?: string;
                category?: string;
                condition?: string;
                search?: string;
                folderId?: string;
            } = {};

            if (rank) filters.rank = rank as string;
            if (date) filters.date = date as string;
            if (worker) filters.worker = worker as string;
            if (category) filters.category = category as string;
            if (condition) filters.condition = condition as string;
            if (search) filters.search = search as string;
            if (folderId) filters.folderId = folderId as string;

            // Generate new Excel file with products filtered by userId and additional filters
            const buffer = await productService.exportProductsToExcel(userId, Object.keys(filters).length > 0 ? filters : undefined);

            // Save file and create history record
            const history = await excelExportHistoryService.saveExportHistory(userId, buffer);

            // Update folder's excelFileName if folderId is provided
            if (filters.folderId) {
                await folderService.updateFolder(filters.folderId, {
                    excelFileName: history.fileName
                });
            }

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(history.fileName)}"`
            );

            // Send buffer as response
            res.send(buffer);
        } catch (error: any) {
            console.log('Error exporting Excel file:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                managementNumber: error.managementNumber || null
            });
        }
    };

    /**
     * Get all Excel export history
     */
    getExportHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const history = await excelExportHistoryService.getAllExportHistory();
            res.status(200).json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error getting export history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get export history',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get export history by user ID
     */
    getExportHistoryByUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            const history = await excelExportHistoryService.getExportHistoryByUser(userId);
            res.status(200).json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error getting export history by user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get export history',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Delete export history
     */
    deleteExportHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Export history ID is required'
                });
                return;
            }

            await excelExportHistoryService.deleteExportHistory(id);
            res.status(200).json({
                success: true,
                message: 'Export history deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting export history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete export history',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get all folders
     */
    getAllFolders = async (req: Request, res: Response): Promise<void> => {
        try {
            const folders = await folderService.getAllFolders();
            res.status(200).json({
                success: true,
                data: folders
            });
        } catch (error) {
            console.error('Error getting all folders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get folders',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get folders by user ID
     */
    getFoldersByUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            const folders = await folderService.getFoldersByUser(userId);
            res.status(200).json({
                success: true,
                data: folders
            });
        } catch (error) {
            console.error('Error getting folders by user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get folders',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get folder by ID
     */
    getFolderById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Folder ID is required'
                });
                return;
            }

            const folder = await folderService.getFolderById(id);
            if (!folder) {
                res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: folder
            });
        } catch (error) {
            console.error('Error getting folder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get folder',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Delete folder
     */
    deleteFolder = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Folder ID is required'
                });
                return;
            }

            await folderService.deleteFolder(id);
            res.status(200).json({
                success: true,
                message: 'Folder deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting folder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete folder',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}

export const batchController = new BatchController();
