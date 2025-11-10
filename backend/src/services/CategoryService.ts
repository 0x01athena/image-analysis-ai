import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoryService {
    /**
     * Get all unique top-level categories (category field)
     */
    async getTopLevelCategories(): Promise<string[]> {
        try {
            const categories = await prisma.category.findMany({
                select: {
                    category: true
                },
                distinct: ['category'],
                orderBy: {
                    category: 'asc'
                }
            });

            return categories.map(c => c.category);
        } catch (error) {
            console.error('Error getting top-level categories:', error);
            throw error;
        }
    }

    /**
     * Get categories for a specific level based on parent selections
     */
    async getCategoriesByLevel(
        level: number,
        parentCategory?: string,
        parentCategory2?: string,
        parentCategory3?: string,
        parentCategory4?: string,
        parentCategory5?: string,
        parentCategory6?: string,
        parentCategory7?: string
    ): Promise<Array<{ name: string; code?: string; hasChildren: boolean }>> {
        try {
            let whereClause: any = {};

            // Build where clause based on parent selections
            if (level === 2 && parentCategory) {
                whereClause.category = parentCategory;
                whereClause.category2 = { not: null };
            } else if (level === 3 && parentCategory && parentCategory2) {
                whereClause.category = parentCategory;
                whereClause.category2 = parentCategory2;
                whereClause.category3 = { not: null };
            } else if (level === 4 && parentCategory && parentCategory2 && parentCategory3) {
                whereClause.category = parentCategory;
                whereClause.category2 = parentCategory2;
                whereClause.category3 = parentCategory3;
                whereClause.category4 = { not: null };
            } else if (level === 5 && parentCategory && parentCategory2 && parentCategory3 && parentCategory4) {
                whereClause.category = parentCategory;
                whereClause.category2 = parentCategory2;
                whereClause.category3 = parentCategory3;
                whereClause.category4 = parentCategory4;
                whereClause.category5 = { not: null };
            } else if (level === 6 && parentCategory && parentCategory2 && parentCategory3 && parentCategory4 && parentCategory5) {
                whereClause.category = parentCategory;
                whereClause.category2 = parentCategory2;
                whereClause.category3 = parentCategory3;
                whereClause.category4 = parentCategory4;
                whereClause.category5 = parentCategory5;
                whereClause.category6 = { not: null };
            } else if (level === 7 && parentCategory && parentCategory2 && parentCategory3 && parentCategory4 && parentCategory5 && parentCategory6) {
                whereClause.category = parentCategory;
                whereClause.category2 = parentCategory2;
                whereClause.category3 = parentCategory3;
                whereClause.category4 = parentCategory4;
                whereClause.category5 = parentCategory5;
                whereClause.category6 = parentCategory6;
                whereClause.category7 = { not: null };
            } else if (level === 8 && parentCategory && parentCategory2 && parentCategory3 && parentCategory4 && parentCategory5 && parentCategory6 && parentCategory7) {
                whereClause.category = parentCategory;
                whereClause.category2 = parentCategory2;
                whereClause.category3 = parentCategory3;
                whereClause.category4 = parentCategory4;
                whereClause.category5 = parentCategory5;
                whereClause.category6 = parentCategory6;
                whereClause.category7 = parentCategory7;
                whereClause.category8 = { not: null };
            }

            // Select all category fields we need
            const selectFields: any = {
                code: true,
                category: true
            };
            for (let i = 2; i <= 8; i++) {
                selectFields[`category${i}`] = true;
            }

            const categories = await prisma.category.findMany({
                where: whereClause,
                select: selectFields
            });

            // Get unique category names for this level
            const uniqueCategories = new Map<string, { code?: string; hasChildren: boolean }>();

            categories.forEach(cat => {
                const categoryName = cat[`category${level}` as keyof typeof cat] as string;
                if (categoryName) {
                    if (!uniqueCategories.has(categoryName)) {
                        // Check if this category has children (next level exists)
                        let hasChildren = false;
                        let code: string | undefined = undefined;

                        if (level < 8) {
                            const nextLevelField = `category${level + 1}`;
                            // Since whereClause already filters by parent path, we just need to check
                            // if any category with this name has a next level value
                            hasChildren = categories.some(c => {
                                const currentName = c[`category${level}` as keyof typeof c] as string;
                                const nextName = c[nextLevelField as keyof typeof c] as string;
                                return currentName === categoryName && nextName !== null && nextName !== undefined;
                            });
                        }

                        // If this is a final level (no children) and we're at level 3 or higher, get the code
                        if (!hasChildren && level >= 3) {
                            // Find a category with this name that has a code (final level)
                            // Since whereClause already filters by parent path, we just need to find one with no next level
                            const finalCategory = categories.find(c => {
                                const name = c[`category${level}` as keyof typeof c] as string;
                                const nextName = level < 8 ? c[`category${level + 1}` as keyof typeof c] as string : null;
                                return name === categoryName && (nextName === null || nextName === undefined);
                            });
                            code = finalCategory?.code;
                        }

                        uniqueCategories.set(categoryName, { code, hasChildren });
                    }
                }
            });

            return Array.from(uniqueCategories.entries()).map(([name, data]) => ({
                name,
                code: data.code,
                hasChildren: data.hasChildren
            })).sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error(`Error getting categories for level ${level}:`, error);
            throw error;
        }
    }

    /**
     * Get category code for final selection
     */
    async getCategoryCode(
        category: string,
        category2?: string,
        category3?: string,
        category4?: string,
        category5?: string,
        category6?: string,
        category7?: string,
        category8?: string
    ): Promise<string | null> {
        try {
            const whereClause: any = { category };
            if (category2) whereClause.category2 = category2;
            if (category3) whereClause.category3 = category3;
            if (category4) whereClause.category4 = category4;
            if (category5) whereClause.category5 = category5;
            if (category6) whereClause.category6 = category6;
            if (category7) whereClause.category7 = category7;
            if (category8) whereClause.category8 = category8;

            const result = await prisma.category.findFirst({
                where: whereClause,
                select: {
                    code: true
                }
            });

            return result?.code || null;
        } catch (error) {
            console.error('Error getting category code:', error);
            throw error;
        }
    }
}

export const categoryService = new CategoryService();

