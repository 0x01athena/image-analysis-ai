import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateFolderData {
    userId: string;
    foldername: string;
}

export interface UpdateFolderData {
    numberOfUploadedProducts?: number;
    excelFileName?: string | null;
}

export class FolderService {
    /**
     * Create a new folder or get existing folder
     */
    async createOrGetFolder(data: CreateFolderData): Promise<any> {
        try {
            // Try to find existing folder
            const existingFolder = await prisma.folder.findUnique({
                where: {
                    userId_foldername: {
                        userId: data.userId,
                        foldername: data.foldername
                    }
                }
            });

            if (existingFolder) {
                return existingFolder;
            }

            // Create new folder
            const folder = await prisma.folder.create({
                data: {
                    userId: data.userId,
                    foldername: data.foldername,
                    numberOfUploadedProducts: 0
                }
            });

            return folder;
        } catch (error) {
            console.error('Error creating or getting folder:', error);
            throw error;
        }
    }

    /**
     * Get folder by ID
     */
    async getFolderById(id: string): Promise<any | null> {
        try {
            return await prisma.folder.findUnique({
                where: { id },
                include: {
                    user: true,
                    products: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        } catch (error) {
            console.error('Error getting folder:', error);
            throw error;
        }
    }

    /**
     * Get all folders for a user
     */
    async getFoldersByUser(userId: string): Promise<any[]> {
        try {
            return await prisma.folder.findMany({
                where: { userId },
                include: {
                    user: true,
                    _count: {
                        select: { products: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting folders by user:', error);
            throw error;
        }
    }

    /**
     * Get all folders
     */
    async getAllFolders(): Promise<any[]> {
        try {
            return await prisma.folder.findMany({
                include: {
                    user: true,
                    _count: {
                        select: { products: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting all folders:', error);
            throw error;
        }
    }

    /**
     * Update folder
     */
    async updateFolder(id: string, data: UpdateFolderData): Promise<any> {
        try {
            const updateData: any = {
                updatedAt: new Date()
            };

            if (data.numberOfUploadedProducts !== undefined) {
                updateData.numberOfUploadedProducts = data.numberOfUploadedProducts;
            }

            if (data.excelFileName !== undefined) {
                updateData.excelFileName = data.excelFileName;
            }

            return await prisma.folder.update({
                where: { id },
                data: updateData
            });
        } catch (error) {
            console.error('Error updating folder:', error);
            throw error;
        }
    }

    /**
     * Increment product count for a folder
     */
    async incrementProductCount(folderId: string, count: number = 1): Promise<any> {
        try {
            const folder = await prisma.folder.findUnique({
                where: { id: folderId }
            });

            if (!folder) {
                throw new Error(`Folder with id ${folderId} not found`);
            }

            return await prisma.folder.update({
                where: { id: folderId },
                data: {
                    numberOfUploadedProducts: folder.numberOfUploadedProducts + count
                }
            });
        } catch (error) {
            console.error('Error incrementing product count:', error);
            throw error;
        }
    }

    /**
     * Update product count based on actual products in folder
     */
    async updateProductCount(folderId: string): Promise<any> {
        try {
            const count = await prisma.product.count({
                where: { folderId }
            });

            return await prisma.folder.update({
                where: { id: folderId },
                data: {
                    numberOfUploadedProducts: count
                }
            });
        } catch (error) {
            console.error('Error updating product count:', error);
            throw error;
        }
    }

    /**
     * Delete folder
     */
    async deleteFolder(id: string): Promise<any> {
        try {
            return await prisma.folder.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    }

    /**
     * Get folder by user and foldername
     */
    async getFolderByUserAndName(userId: string, foldername: string): Promise<any | null> {
        try {
            return await prisma.folder.findUnique({
                where: {
                    userId_foldername: {
                        userId,
                        foldername
                    }
                }
            });
        } catch (error) {
            console.error('Error getting folder by user and name:', error);
            throw error;
        }
    }
}

export const folderService = new FolderService();

