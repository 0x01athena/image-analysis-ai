import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserData {
    username: string;
}

export class UserService {
    /**
     * Create a new user
     */
    async createUser(data: UserData): Promise<any> {
        try {
            const newUser = await prisma.user.create({
                data: {
                    username: data.username
                }
            });
            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<any[]> {
        try {
            return await prisma.user.findMany({
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<any | null> {
        try {
            return await prisma.user.findUnique({
                where: { id }
            });
        } catch (error) {
            console.error(`Error getting user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username: string): Promise<any | null> {
        try {
            return await prisma.user.findUnique({
                where: { username }
            });
        } catch (error) {
            console.error(`Error getting user by username ${username}:`, error);
            throw error;
        }
    }

    /**
     * Update user
     */
    async updateUser(id: string, data: Partial<UserData>): Promise<any> {
        try {
            const updateData: any = {
                updatedAt: new Date()
            };

            if (data.username !== undefined) updateData.username = data.username;

            const updatedUser = await prisma.user.update({
                where: { id },
                data: updateData
            });

            return updatedUser;
        } catch (error) {
            console.error(`Error updating user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete user by ID
     */
    async deleteUser(id: string): Promise<any> {
        try {
            const deletedUser = await prisma.user.delete({
                where: { id }
            });

            console.log(`Successfully deleted user ${id}`);
            return deletedUser;
        } catch (error) {
            console.error(`Error deleting user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete multiple users by IDs
     */
    async deleteMultipleUsers(ids: string[]): Promise<{ deleted: string[], failed: string[] }> {
        const deleted: string[] = [];
        const failed: string[] = [];

        for (const id of ids) {
            try {
                await this.deleteUser(id);
                deleted.push(id);
            } catch (error) {
                console.error(`Failed to delete user ${id}:`, error);
                failed.push(id);
            }
        }

        return { deleted, failed };
    }
}

export const userService = new UserService();
