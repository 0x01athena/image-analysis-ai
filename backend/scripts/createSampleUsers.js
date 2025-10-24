import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleUsers() {
    try {
        // Create sample users
        const users = [
            { username: '田中太郎' },
            { username: '佐藤花子' },
            { username: '鈴木一郎' },
            { username: '高橋美咲' },
            { username: '山田健太' }
        ];

        console.log('Creating sample users...');

        for (const userData of users) {
            try {
                const user = await prisma.user.create({
                    data: userData
                });
                console.log(`Created user: ${user.username} (ID: ${user.id})`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`User ${userData.username} already exists, skipping...`);
                } else {
                    console.error(`Error creating user ${userData.username}:`, error);
                }
            }
        }

        console.log('Sample users creation completed!');

        // List all users
        const allUsers = await prisma.user.findMany();
        console.log('\nAll users in database:');
        allUsers.forEach(user => {
            console.log(`- ${user.username} (ID: ${user.id})`);
        });

    } catch (error) {
        console.error('Error creating sample users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSampleUsers();
