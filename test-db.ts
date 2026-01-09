
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing database connection...')
    try {
        const userCount = await prisma.user.count()
        console.log('User count:', userCount)

        if (userCount > 0) {
            const user = await prisma.user.findFirst()
            console.log('First user ID:', user?.id)
        } else {
            console.log('No users found. Please register first.')
        }
    } catch (error) {
        console.error('Database connection error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
