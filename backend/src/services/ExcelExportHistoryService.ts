import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { getJSTDateComponents } from '../utils/dateUtils';

const prisma = new PrismaClient();

export class ExcelExportHistoryService {
    /**
     * Save export history and file to disk
     */
    async saveExportHistory(userId: string, buffer: Buffer | ArrayBuffer): Promise<any> {
        try {
            // Create exports directory if it doesn't exist
            const exportsDir = path.join(__dirname, '../../public/exports');
            if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
            }

            // Generate unique filename with format: products_export_2025-12-12T20-15-39-829JST.xlsx (using JST)
            const components = getJSTDateComponents();
            const timestamp = `${components.year}-${String(components.month).padStart(2, '0')}-${String(components.day).padStart(2, '0')}T${String(components.hour).padStart(2, '0')}-${String(components.minute).padStart(2, '0')}-${String(components.second).padStart(2, '0')}JST`;
            const fileName = `products_export_${timestamp}.xlsx`;
            const filePath = path.join(exportsDir, fileName);

            // Save file to disk
            const bufferToWrite = buffer instanceof Buffer ? buffer : Buffer.from(new Uint8Array(buffer));
            fs.writeFileSync(filePath, bufferToWrite);

            // Create history record
            const history = await prisma.excelExportHistory.create({
                data: {
                    userId: userId,
                    fileName: fileName,
                    fileUrl: `/exports/${fileName}`
                }
            });

            console.log(`Saved export history for user ${userId}: ${fileName}`);

            return history;
        } catch (error) {
            console.error('Error saving export history:', error);
            throw error;
        }
    }

    /**
     * Get all export history
     */
    async getAllExportHistory(): Promise<any[]> {
        try {
            return await prisma.excelExportHistory.findMany({
                include: {
                    user: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting all export history:', error);
            throw error;
        }
    }

    /**
     * Get export history by user ID
     */
    async getExportHistoryByUser(userId: string): Promise<any[]> {
        try {
            return await prisma.excelExportHistory.findMany({
                where: { userId },
                include: {
                    user: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting export history by user:', error);
            throw error;
        }
    }

    /**
     * Delete export history and file
     */
    async deleteExportHistory(id: string): Promise<any> {
        try {
            const history = await prisma.excelExportHistory.findUnique({
                where: { id }
            });

            if (!history) {
                throw new Error('Export history not found');
            }

            // Delete file from disk
            const filePath = path.join(__dirname, '../../public', history.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Delete history record
            return await prisma.excelExportHistory.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting export history:', error);
            throw error;
        }
    }
}

export const excelExportHistoryService = new ExcelExportHistoryService();

