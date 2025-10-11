import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductImages {
    [productId: string]: string[];
}

interface ProcessingStatus {
    isProcessing: boolean;
    currentProduct: string | null;
    totalProducts: number;
    processedProducts: number;
    failedProducts: number;
    startTime: Date | null;
    estimatedCompletion: Date | null;
}

interface ProcessingResult {
    productId: string;
    images: string[];
    title: string;
    category: string;
    rank: 'A' | 'B' | 'C';
    measurements?: string;
    condition?: string;
    processingTime: number;
    error?: string;
}

class BatchController {
    private processingStatus: ProcessingStatus = {
        isProcessing: false,
        currentProduct: null,
        totalProducts: 0,
        processedProducts: 0,
        failedProducts: 0,
        startTime: null,
        estimatedCompletion: null
    };

    private processingResults: ProcessingResult[] = [];
    private productImages: ProductImages = {};

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
            this.productImages = {};

            console.log('Uploading files:', uploadedFiles.map(f => f.originalname));

            // Group images by product ID (extracted from filename)
            uploadedFiles.forEach(file => {
                // Handle both regular uploads and directory uploads
                let filename = file.originalname;

                // If it's a directory upload, extract just the filename from the path
                if (filename.includes('/')) {
                    filename = filename.split('/').pop() || filename;
                }

                const productId = filename.split('_')[0];

                console.log(`Processing file: ${file.originalname} -> ${filename}, Product ID: ${productId}`);

                if (productId && filename.includes('_')) {
                    if (!this.productImages[productId]) {
                        this.productImages[productId] = [];
                    }
                    this.productImages[productId].push(file.filename);
                } else {
                    console.log(`Skipping file ${filename} - doesn't match expected pattern`);
                }
            });

            console.log('Final product images:', this.productImages);

            // Save products to database
            const savedProducts = await this.saveProductsToDatabase(this.productImages);

            const totalProducts = Object.keys(this.productImages).length;
            const totalImages = uploadedFiles.length;

            res.status(200).json({
                success: true,
                message: 'Images uploaded successfully',
                data: {
                    totalImages,
                    totalProducts,
                    savedProducts,
                    productGroups: Object.keys(this.productImages).map(productId => ({
                        productId,
                        imageCount: this.productImages[productId].length,
                        images: this.productImages[productId]
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
            console.log('Starting batch processing. Product images:', Object.keys(this.productImages));
            console.log('Product images count:', Object.keys(this.productImages).length);

            if (Object.keys(this.productImages).length === 0) {
                console.log('No images available for processing');
                res.status(400).json({
                    success: false,
                    message: 'No images available for processing'
                });
                return;
            }

            if (this.processingStatus.isProcessing) {
                res.status(400).json({
                    success: false,
                    message: 'Batch processing is already in progress'
                });
                return;
            }

            // Initialize processing status
            this.processingStatus = {
                isProcessing: true,
                currentProduct: null,
                totalProducts: Object.keys(this.productImages).length,
                processedProducts: 0,
                failedProducts: 0,
                startTime: new Date(),
                estimatedCompletion: null
            };

            this.processingResults = [];

            // Start processing in background
            this.processProductsAsync();

            res.status(200).json({
                success: true,
                message: 'Batch processing started',
                data: {
                    totalProducts: this.processingStatus.totalProducts,
                    startTime: this.processingStatus.startTime
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
     * Get current processing status
     */
    getProcessingStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                data: this.processingStatus
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
     * Debug endpoint to check controller state
     */
    getDebugInfo = async (req: Request, res: Response): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    productImagesCount: Object.keys(this.productImages).length,
                    productImages: this.productImages,
                    processingStatus: this.processingStatus,
                    resultsCount: this.processingResults.length
                }
            });
        } catch (error) {
            console.error('Error getting debug info:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get debug info',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get processing results
     */
    getProcessingResults = async (req: Request, res: Response): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    results: this.processingResults,
                    summary: {
                        total: this.processingResults.length,
                        rankA: this.processingResults.filter(r => r.rank === 'A').length,
                        rankB: this.processingResults.filter(r => r.rank === 'B').length,
                        rankC: this.processingResults.filter(r => r.rank === 'C').length
                    }
                }
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
     * Process products asynchronously (single thread simulation)
     */
    private async processProductsAsync() {
        const productIds = Object.keys(this.productImages);

        for (const productId of productIds) {
            this.processingStatus.currentProduct = productId;

            try {
                const startTime = Date.now();
                const result = await this.processSingleProduct(productId, this.productImages[productId]);
                const processingTime = Date.now() - startTime;

                this.processingResults.push({
                    ...result,
                    processingTime
                });

                this.processingStatus.processedProducts++;
            } catch (error) {
                console.error(`Error processing product ${productId}:`, error);

                this.processingResults.push({
                    productId,
                    images: this.productImages[productId],
                    title: '',
                    category: '',
                    rank: 'C',
                    processingTime: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });

                this.processingStatus.failedProducts++;
            }

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Mark processing as complete
        this.processingStatus.isProcessing = false;
        this.processingStatus.currentProduct = null;
        this.processingStatus.estimatedCompletion = new Date();
    }

    /**
     * Process a single product (simulate AI analysis)
     */
    private async processSingleProduct(productId: string, images: string[]): Promise<Omit<ProcessingResult, 'processingTime'>> {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

        // Simulate different outcomes based on random factors
        const randomFactor = Math.random();

        if (randomFactor < 0.1) {
            // 10% chance of failure (Rank C)
            throw new Error('AI analysis failed');
        } else if (randomFactor < 0.4) {
            // 30% chance of Rank B (short title)
            return {
                productId,
                images,
                title: `商品タイトル ${productId} 短い`,
                category: this.generateRandomCategory(),
                rank: 'B'
            };
        } else {
            // 60% chance of Rank A (long title)
            return {
                productId,
                images,
                title: `高品質な商品タイトル ${productId} 詳細な説明付き おすすめ商品`,
                category: this.generateRandomCategory(),
                rank: 'A'
            };
        }
    }

    /**
     * Generate random category for simulation
     */
    private generateRandomCategory(): string {
        const categories = [
            'ファッション', 'アクセサリー', 'バッグ', '靴', '時計',
            '美容・健康', 'スポーツ', 'アウトドア', '家電', '雑貨'
        ];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    /**
     * Save products to database
     */
    private async saveProductsToDatabase(productImages: ProductImages): Promise<any[]> {
        const savedProducts = [];

        for (const [managementNumber, images] of Object.entries(productImages)) {
            try {
                // Check if product already exists
                const existingProduct = await prisma.product.findUnique({
                    where: { managementNumber }
                });

                if (existingProduct) {
                    // Update existing product with new images
                    const existingImages = JSON.parse(existingProduct?.images as string || "[]");
                    const updatedImages = [...existingImages, ...images];
                    const updatedProduct = await prisma.product.update({
                        where: { managementNumber },
                        data: {
                            images: JSON.stringify(updatedImages),
                            updatedAt: new Date()
                        }
                    });
                    savedProducts.push(updatedProduct);
                    console.log(`Updated product ${managementNumber} with ${images.length} new images`);
                } else {
                    // Create new product
                    const newProduct = await prisma.product.create({
                        data: {
                            managementNumber,
                            images: JSON.stringify(images),
                            title: null,
                            level: null,
                            measurement: null,
                            condition: null,
                            category: null,
                            shop1: null,
                            shop2: null,
                            shop3: null
                        }
                    });
                    savedProducts.push(newProduct);
                    console.log(`Created new product ${managementNumber} with ${images.length} images`);
                }
            } catch (error) {
                console.error(`Error saving product ${managementNumber}:`, error);
            }
        }

        return savedProducts;
    }
}

export const batchController = new BatchController();
