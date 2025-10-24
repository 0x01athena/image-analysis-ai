import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkProcessData {
    userId: string;
    productIds: string[];
}

export class WorkProcessService {
    /**
     * Create a new work process
     */
    async createWorkProcess(data: WorkProcessData): Promise<any> {
        try {
            const workProcess = await prisma.workProcess.create({
                data: {
                    userId: data.userId,
                    productIds: JSON.stringify(data.productIds)
                },
                include: {
                    user: true
                }
            });

            return workProcess;
        } catch (error) {
            console.error('Error creating work process:', error);
            throw error;
        }
    }

    /**
     * Get work process by ID
     */
    async getWorkProcessById(id: string): Promise<any | null> {
        try {
            const workProcess = await prisma.workProcess.findUnique({
                where: { id },
                include: {
                    user: true
                }
            });

            if (workProcess) {
                return {
                    ...workProcess,
                    productIds: JSON.parse(workProcess.productIds as string)
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting work process by ID:', error);
            throw error;
        }
    }

    /**
     * Update current product being processed
     */
    async updateCurrentProduct(workProcessId: string, currentProductId: string): Promise<any> {
        try {
            const workProcess = await prisma.workProcess.update({
                where: { id: workProcessId },
                data: {
                    currentProductId,
                    updatedAt: new Date()
                },
                include: {
                    user: true
                }
            });

            return {
                ...workProcess,
                productIds: JSON.parse(workProcess.productIds as string)
            };
        } catch (error) {
            console.error('Error updating current product:', error);
            throw error;
        }
    }

    /**
     * Mark work process as finished
     */
    async markWorkProcessFinished(id: string): Promise<any> {
        try {
            const workProcess = await prisma.workProcess.update({
                where: { id },
                data: {
                    isFinished: true,
                    updatedAt: new Date()
                },
                include: {
                    user: true
                }
            });

            return {
                ...workProcess,
                productIds: JSON.parse(workProcess.productIds as string)
            };
        } catch (error) {
            console.error('Error marking work process finished:', error);
            throw error;
        }
    }

    /**
     * Increment finished products count
     */
    async incrementFinishedProducts(workProcessId: string): Promise<any> {
        try {
            const workProcess = await prisma.workProcess.update({
                where: { id: workProcessId },
                data: {
                    finishedProducts: {
                        increment: 1
                    },
                    updatedAt: new Date()
                },
                include: {
                    user: true
                }
            });

            return {
                ...workProcess,
                productIds: JSON.parse(workProcess.productIds as string)
            };
        } catch (error) {
            console.error('Error incrementing finished products:', error);
            throw error;
        }
    }

    /**
     * Get active work processes for a user
     */
    async getActiveWorkProcessesByUser(userId: string): Promise<any[]> {
        try {
            const workProcesses = await prisma.workProcess.findMany({
                where: {
                    userId,
                    isFinished: false
                },
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Parse productIds JSON string back to array for each work process
            return workProcesses.map(wp => ({
                ...wp,
                productIds: JSON.parse(wp.productIds as string)
            }));
        } catch (error) {
            console.error('Error getting active work processes by user:', error);
            throw error;
        }
    }

    /**
     * Get all work processes
     */
    async getAllWorkProcesses(): Promise<any[]> {
        try {
            const workProcesses = await prisma.workProcess.findMany({
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Parse productIds JSON string back to array for each work process
            return workProcesses.map(wp => ({
                ...wp,
                productIds: JSON.parse(wp.productIds as string)
            }));
        } catch (error) {
            console.error('Error getting all work processes:', error);
            throw error;
        }
    }

    /**
     * Delete work process by ID
     */
    async deleteWorkProcess(id: string): Promise<any> {
        try {
            const workProcess = await prisma.workProcess.delete({
                where: { id }
            });

            return workProcess;
        } catch (error) {
            console.error('Error deleting work process:', error);
            throw error;
        }
    }

    /**
     * Get work process statistics
     */
    async getWorkProcessStats(): Promise<{
        total: number;
        finished: number;
        active: number;
        byUser: Array<{
            userId: string;
            username: string;
            total: number;
            finished: number;
            active: number;
        }>;
    }> {
        try {
            const allWorkProcesses = await this.getAllWorkProcesses();

            const total = allWorkProcesses.length;
            const finished = allWorkProcesses.filter(wp => wp.isFinished).length;
            const active = total - finished;

            // Group by user
            const userStats = new Map();
            allWorkProcesses.forEach(wp => {
                const userId = wp.userId;
                const username = wp.user.username;

                if (!userStats.has(userId)) {
                    userStats.set(userId, {
                        userId,
                        username,
                        total: 0,
                        finished: 0,
                        active: 0
                    });
                }

                const stats = userStats.get(userId);
                stats.total++;
                if (wp.isFinished) {
                    stats.finished++;
                } else {
                    stats.active++;
                }
            });

            return {
                total,
                finished,
                active,
                byUser: Array.from(userStats.values())
            };
        } catch (error) {
            console.error('Error getting work process stats:', error);
            throw error;
        }
    }
}

export const workProcessService = new WorkProcessService();
