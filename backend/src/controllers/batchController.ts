import { Request, Response } from 'express';
import { productService, ProductImages } from '../services/ProductService';
import { processingStateService, ProcessingResult } from '../services/ProcessingStateService';
import { openAIService, OpenAIProductAnalysis } from '../services/OpenAIService';



class BatchController {
    /**
     * Upload images from directory and group by product ID
     */
    uploadDirectoryImages = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No images provided'
                });
                return;
            }

            const uploadedFiles = req.files as Express.Multer.File[];
            const productImages: ProductImages = {};
            const skippedFiles: Array<{ filename: string, reason: string, size?: number }> = [];
            const MAX_FILE_SIZE = 1 * 1024 * 1024; // 5MB

            // Group images by product ID (extracted from filename) and check file sizes
            uploadedFiles.forEach(file => {
                // Check file size
                if (file.size > MAX_FILE_SIZE) {
                    skippedFiles.push({
                        filename: file.originalname,
                        reason: 'File too large',
                        size: file.size
                    });
                    console.log(`Skipping file ${file.originalname} - size ${file.size} exceeds 5MB limit`);
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

            // Save products to database
            const savedProducts = await productService.saveProductsFromImages(productImages);

            // Create a processing session
            const sessionId = processingStateService.createSession(productImages);

            // Set upload status to true during upload
            processingStateService.updateUploadStatus(sessionId, {
                isUploading: true,
                totalFiles: uploadedFiles.length,
                uploadedFiles: uploadedFiles.length - skippedFiles.length,
                skippedFiles: skippedFiles.length,
                uploadProgress: 100 // Upload is complete
            });

            const totalProducts = Object.keys(productImages).length;
            const totalImages = uploadedFiles.length;

            res.status(200).json({
                success: true,
                message: 'Images uploaded successfully',
                data: {
                    sessionId,
                    totalImages,
                    totalProducts,
                    savedProducts,
                    skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
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
            const { sessionId } = body;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Session ID is required in request body'
                });
                return;
            }

            const session = processingStateService.getSession(sessionId);
            if (!session) {
                res.status(404).json({
                    success: false,
                    message: 'Session not found or expired'
                });
                return;
            }

            console.log('Starting batch processing. Product images:', Object.keys(session.productImages));
            console.log('Product images count:', Object.keys(session.productImages).length);

            if (Object.keys(session.productImages).length === 0) {
                console.log('No images available for processing');
                res.status(400).json({
                    success: false,
                    message: 'No images available for processing'
                });
                return;
            }

            if (session.processingStatus.isProcessing) {
                res.status(400).json({
                    success: false,
                    message: 'Batch processing is already in progress'
                });
                return;
            }

            // Initialize processing status
            processingStateService.updateProcessingStatus(sessionId, {
                isProcessing: true,
                currentProduct: null,
                totalProducts: Object.keys(session.productImages).length,
                processedProducts: 0,
                failedProducts: 0,
                startTime: new Date(),
                estimatedCompletion: null
            });

            // Keep upload status active until AI analysis actually starts
            // This prevents the brief flicker between upload completion and AI start
            processingStateService.updateUploadStatus(sessionId, {
                isUploading: true // Keep as true until AI processing begins
            });

            // Start processing in background
            this.processProductsAsync(sessionId);

            res.status(200).json({
                success: true,
                message: 'Batch processing started',
                data: {
                    sessionId,
                    totalProducts: Object.keys(session.productImages).length,
                    startTime: new Date()
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
    private async processProductsAsync(sessionId: string) {
        const session = processingStateService.getSession(sessionId);
        if (!session) return;

        const productIds = Object.keys(session.productImages);

        // Set upload status to false when AI analysis actually begins
        processingStateService.updateUploadStatus(sessionId, {
            isUploading: false
        });

        for (const productId of productIds) {
            processingStateService.updateProcessingStatus(sessionId, {
                currentProduct: productId
            });

            try {
                const startTime = Date.now();
                const result = await this.processSingleProduct(productId, session.productImages[productId]);
                const processingTime = Date.now() - startTime;

                const processingResult: ProcessingResult = {
                    ...result,
                    processingTime
                };

                processingStateService.addProcessingResult(sessionId, processingResult);
                processingStateService.updateProcessingStatus(sessionId, {
                    processedProducts: session.processingStatus.processedProducts + 1
                });
            } catch (error) {
                console.error(`Error processing product ${productId}:`, error);

                const processingResult: ProcessingResult = {
                    productId,
                    images: session.productImages[productId],
                    title: '',
                    category: '',
                    rank: 'C',
                    processingTime: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };

                processingStateService.addProcessingResult(sessionId, processingResult);
                processingStateService.updateProcessingStatus(sessionId, {
                    failedProducts: session.processingStatus.failedProducts + 1
                });
            }

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Mark processing as complete
        processingStateService.updateProcessingStatus(sessionId, {
            isProcessing: false,
            currentProduct: null,
            estimatedCompletion: new Date()
        });
    }

    /**
     * Process a single product using OpenAI Vision API
     */
    private async processSingleProduct(productId: string, images: string[]): Promise<Omit<ProcessingResult, 'processingTime'>> {
        try {
            console.log(`Processing product ${productId} with ${images.length} images using OpenAI...`);

            // Call OpenAI to analyze the product images
            const analysis: OpenAIProductAnalysis = await openAIService.analyzeProductImages(productId, images);

            console.log(`OpenAI analysis for product ${productId}:`, analysis);

            // Update the product in the database with the analysis results
            await productService.updateProductWithResults(productId, {
                managementNumber: productId,
                images: images,
                title: analysis.title[0] || '', // Use first title as default
                candidateTitles: analysis.title, // Store all candidate titles
                level: analysis.level,
                measurement: analysis.measurement,
                condition: analysis.condition,
                category: analysis.category,
                shop1: analysis.shop1,
                shop2: analysis.shop2,
                shop3: analysis.shop3
            });

            return {
                productId,
                images,
                title: analysis.title[0] || '', // Return first title for display
                candidateTitles: analysis.title, // Include all candidate titles
                category: analysis.category,
                rank: analysis.level,
                measurements: analysis.measurement,
                condition: analysis.condition
            };

        } catch (error) {
            console.error(`Error processing product ${productId} with OpenAI:`, error);

            // If OpenAI fails, return a default result
            return {
                productId,
                images,
                title: `商品 ${productId}`,
                category: '未分類',
                rank: 'C',
                measurements: '測定不可',
                condition: '状態不明'
            };
        }
    }

    /**
     * Get processing status for a session
     */
    getProcessingStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
                return;
            }

            const status = processingStateService.getProcessingStatus(sessionId);
            if (!status) {
                res.status(404).json({
                    success: false,
                    message: 'Session not found or expired'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Error getting processing status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get processing status',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get processing results for a session
     */
    getProcessingResults = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
                return;
            }

            const results = processingStateService.getProcessingResults(sessionId);
            if (!results) {
                res.status(404).json({
                    success: false,
                    message: 'Session not found or expired'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Error getting processing results:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get processing results',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get all active processing sessions
     */
    getActiveSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            // Clean up completed sessions first
            const cleanedCount = processingStateService.cleanupCompletedSessions();
            if (cleanedCount > 0) {
                console.log(`Cleaned up ${cleanedCount} completed sessions`);
            }

            const sessions = processingStateService.getAllSessions();

            // Filter only sessions that are currently processing
            const activeSessions = sessions
                .filter(session => session.processingStatus.isProcessing)
                .map(session => ({
                    sessionId: session.sessionId,
                    processingStatus: session.processingStatus
                }));

            res.status(200).json({
                success: true,
                data: activeSessions
            });

        } catch (error) {
            console.error('Error getting active sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get active sessions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get all products with pagination and filtering
     */
    getAllProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const { page = 1, limit = 50, rank, date } = req.query;

            const products = await productService.getAllProducts();

            // Apply filters
            let filteredProducts = products;

            if (rank) {
                filteredProducts = filteredProducts.filter((p: any) => p.level === rank);
            }

            if (date) {
                const targetDate = new Date(date as string);
                filteredProducts = filteredProducts.filter((p: any) => {
                    const productDate = new Date(p.createdAt);
                    return productDate.toDateString() === targetDate.toDateString();
                });
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
}

export const batchController = new BatchController();
