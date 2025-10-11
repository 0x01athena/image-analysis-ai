import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductImages {
    [productId: string]: string[];
}

export interface ProductData {
    managementNumber: string;
    images: string[];
    title?: string | null;
    level?: string | null;
    measurement?: string | null;
    condition?: string | null;
    category?: string | null;
    shop1?: string | null;
    shop2?: string | null;
    shop3?: string | null;
}

export class ProductService {
    /**
     * Save products to database from product images mapping
     */
    async saveProductsFromImages(productImages: ProductImages): Promise<any[]> {
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

    /**
     * Update product with processing results
     */
    async updateProductWithResults(managementNumber: string, data: Partial<ProductData>): Promise<any> {
        try {
            const updateData: any = {
                updatedAt: new Date()
            };

            if (data.title !== undefined) updateData.title = data.title;
            if (data.level !== undefined) updateData.level = data.level;
            if (data.measurement !== undefined) updateData.measurement = data.measurement;
            if (data.condition !== undefined) updateData.condition = data.condition;
            if (data.category !== undefined) updateData.category = data.category;
            if (data.shop1 !== undefined) updateData.shop1 = data.shop1;
            if (data.shop2 !== undefined) updateData.shop2 = data.shop2;
            if (data.shop3 !== undefined) updateData.shop3 = data.shop3;

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
                where: { managementNumber }
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
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting all products:', error);
            throw error;
        }
    }

    /**
     * Delete product by management number
     */
    async deleteProduct(managementNumber: string): Promise<any> {
        try {
            return await prisma.product.delete({
                where: { managementNumber }
            });
        } catch (error) {
            console.error(`Error deleting product ${managementNumber}:`, error);
            throw error;
        }
    }
}

export const productService = new ProductService();