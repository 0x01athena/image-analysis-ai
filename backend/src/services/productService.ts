import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
    shop1?: string | null;
    shop2?: string | null;
    shop3?: string | null;
    price?: number | null;
    userId?: string | null;
}

export class ProductService {
    /**
     * Save products to database from product images mapping with duplicate detection
     */
    async saveProductsFromImages(productImages: ProductImages, price?: number | null): Promise<any[]> {
        const savedProducts = [];

        for (const [managementNumber, newImages] of Object.entries(productImages)) {
            try {
                // Check if product already exists
                const existingProduct = await prisma.product.findUnique({
                    where: { managementNumber }
                });

                if (existingProduct) {
                    // Get existing images
                    const existingImages = JSON.parse(existingProduct?.images as string || "[]");

                    // Handle duplicate files in filesystem
                    const processedNewImages = await this.handleDuplicateFiles(managementNumber, newImages);

                    // Check for duplicates and merge images intelligently
                    const mergedImages = this.mergeImagesWithDuplicateDetection(existingImages, processedNewImages);

                    // Prepare update data
                    const updateData: any = {
                        images: JSON.stringify(mergedImages),
                        updatedAt: new Date()
                    };

                    // Update price if provided
                    if (price !== undefined && price !== null) {
                        updateData.price = price;
                    }

                    // Only update if there are actual changes
                    if (mergedImages.length !== existingImages.length ||
                        !this.arraysEqual(mergedImages, existingImages) ||
                        (price !== undefined && price !== null && existingProduct.price !== price)) {

                        const updatedProduct = await prisma.product.update({
                            where: { managementNumber },
                            data: updateData
                        });
                        savedProducts.push(updatedProduct);
                    } else {
                        console.log(`Product ${managementNumber} already up to date, no changes needed`);
                        savedProducts.push(existingProduct);
                    }
                } else {
                    // Handle duplicate files for new products
                    const processedNewImages = await this.handleDuplicateFiles(managementNumber, newImages);

                    // Create new product
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
                            price: price !== undefined && price !== null ? price : null
                        }
                    });
                    savedProducts.push(newProduct);
                }
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
        updatedProducts: number;
        totalImages: number;
        newImages: number;
        duplicateImages: number;
        details: Array<{
            managementNumber: string;
            status: 'new' | 'updated' | 'no_change';
            existingImages: number;
            newImages: number;
            duplicates: number;
        }>;
    }> {
        const summary = {
            totalProducts: Object.keys(productImages).length,
            newProducts: 0,
            updatedProducts: 0,
            totalImages: 0,
            newImages: 0,
            duplicateImages: 0,
            details: [] as Array<{
                managementNumber: string;
                status: 'new' | 'updated' | 'no_change';
                existingImages: number;
                newImages: number;
                duplicates: number;
            }>
        };

        for (const [managementNumber, newImages] of Object.entries(productImages)) {
            const existingProduct = await prisma.product.findUnique({
                where: { managementNumber }
            });

            const existingImages = existingProduct ? JSON.parse(existingProduct.images as string || "[]") : [];
            const processedNewImages = await this.handleDuplicateFiles(managementNumber, newImages);
            const mergedImages = this.mergeImagesWithDuplicateDetection(existingImages, processedNewImages);

            const addedCount = mergedImages.length - existingImages.length;
            const duplicateCount = newImages.length - addedCount;

            let status: 'new' | 'updated' | 'no_change';
            if (!existingProduct) {
                status = 'new';
                summary.newProducts++;
            } else if (addedCount > 0) {
                status = 'updated';
                summary.updatedProducts++;
            } else {
                status = 'no_change';
            }

            summary.totalImages += newImages.length;
            summary.newImages += addedCount;
            summary.duplicateImages += duplicateCount;

            summary.details.push({
                managementNumber,
                status,
                existingImages: existingImages.length,
                newImages: addedCount,
                duplicates: duplicateCount
            });
        }

        return summary;
    }

    /**
     * Update product with processing results
     */
    async updateProductWithResults(managementNumber: string, data: Partial<ProductData>): Promise<any> {
        try {
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
            if (data.shop1 !== undefined) updateData.shop1 = data.shop1;
            if (data.shop2 !== undefined) updateData.shop2 = data.shop2;
            if (data.shop3 !== undefined) updateData.shop3 = data.shop3;
            if (data.price !== undefined) updateData.price = data.price !== null ? parseFloat(data.price as any) : null;
            if (data.userId !== undefined) updateData.userId = data.userId;

            const updatedProduct = await prisma.product.update({
                where: { managementNumber },
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
     */
    async getProductByManagementNumber(managementNumber: string): Promise<any | null> {
        try {
            return await prisma.product.findUnique({
                where: { managementNumber },
                include: {
                    user: true
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
                    user: true
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
     */
    async deleteProduct(managementNumber: string): Promise<any> {
        try {
            // First, get the product to retrieve image filenames
            const product = await prisma.product.findUnique({
                where: { managementNumber }
            });

            if (!product) {
                throw new Error(`Product with management number ${managementNumber} not found`);
            }

            // Delete the product from database
            const deletedProduct = await prisma.product.delete({
                where: { managementNumber }
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
     */
    async selectTitleFromCandidates(managementNumber: string, selectedTitle: string): Promise<any> {
        try {
            const product = await prisma.product.findUnique({
                where: { managementNumber }
            });

            if (!product) {
                throw new Error(`Product with management number ${managementNumber} not found`);
            }

            const candidateTitles = JSON.parse(product.candidateTitles as string || "[]");

            if (!candidateTitles.includes(selectedTitle)) {
                throw new Error(`Selected title "${selectedTitle}" is not in the candidate titles`);
            }

            const updatedProduct = await prisma.product.update({
                where: { managementNumber },
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
     */
    async getCandidateTitles(managementNumber: string): Promise<string[]> {
        try {
            const product = await prisma.product.findUnique({
                where: { managementNumber }
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
            const product = await prisma.product.findUnique({
                where: { managementNumber: productId },
                select: { categoryList: true }
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

            const product = await prisma.product.findUnique({
                where: { managementNumber: productId },
                select: { categoryList: true }
            });

            console.log('product', product?.categoryList, level);

            let categoryList = await JSON.parse(product?.categoryList as string);
            categoryList = await level === 1 ? [] : categoryList.slice(0, level);

            console.log('categoryList', categoryList);

            const currentCategory = body?.[level === 1 ? `category` : `category${level}`]

            if (!categoryList.includes(currentCategory)) {
                categoryList.push(currentCategory);

                // Update the product
                await prisma.product.update({
                    where: { managementNumber: productId },
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
}

export const productService = new ProductService();
