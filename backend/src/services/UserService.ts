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
            const user = await prisma.user.create({
                data: {
                    username: data.username
                }
            });

            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<any | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { id }
            });

            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username: string): Promise<any | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { username }
            });

            return user;
        } catch (error) {
            console.error('Error getting user by username:', error);
            throw error;
        }
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<any[]> {
        try {
            const users = await prisma.user.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return users;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    async updateUser(id: string, data: Partial<UserData>): Promise<any> {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });

            return user;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Delete user
     */
    async deleteUser(id: string): Promise<any> {
        try {
            const user = await prisma.user.delete({
                where: { id }
            });

            return user;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Delete multiple users
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

    /**
     * Get or create user by username
     */
    async getOrCreateUser(username: string): Promise<any> {
        try {
            let user = await this.getUserByUsername(username);

            if (!user) {
                user = await this.createUser({ username });
            }

            return user;
        } catch (error) {
            console.error('Error getting or creating user:', error);
            throw error;
        }
    }
}

export const userService = new UserService();