import { Request, Response } from 'express';
import { userService, UserData } from '../services/UserService';

class UserController {
    /**
     * Create a new user
     */
    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username } = req.body;

            if (!username || username.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: 'Username is required'
                });
                return;
            }

            // Check if username already exists
            const existingUser = await userService.getUserByUsername(username.trim());
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Username already exists'
                });
                return;
            }

            const userData: UserData = {
                username: username.trim()
            };

            const newUser = await userService.createUser(userData);

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: newUser
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
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
                message: 'Internal server error'
            });
        }
    };

    /**
     * Get user by ID
     */
    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const user = await userService.getUserById(id);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error getting user:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    /**
     * Update user
     */
    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { username } = req.body;

            if (!username || username.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: 'Username is required'
                });
                return;
            }

            // Check if user exists
            const existingUser = await userService.getUserById(id);
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Check if username already exists (excluding current user)
            const userWithSameUsername = await userService.getUserByUsername(username.trim());
            if (userWithSameUsername && userWithSameUsername.id !== id) {
                res.status(409).json({
                    success: false,
                    message: 'Username already exists'
                });
                return;
            }

            const updateData: Partial<UserData> = {
                username: username.trim()
            };

            const updatedUser = await userService.updateUser(id, updateData);

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    /**
     * Delete user
     */
    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await userService.getUserById(id);
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            await userService.deleteUser(id);

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    /**
     * Delete multiple users
     */
    deleteMultipleUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
                return;
            }

            const result = await userService.deleteMultipleUsers(ids);

            res.status(200).json({
                success: true,
                message: 'Bulk delete operation completed',
                data: result
            });
        } catch (error) {
            console.error('Error deleting multiple users:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
}

export const userController = new UserController();
