const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function updateLogs(taskId, step, message, meta = {}) {
    if (!taskId) {
        logger.error("taskId not found")
        throw new Error("taskId is required");
    }

    if (!step) {
        logger.error("step not found")
        throw new Error("step is required");
    }

    if (!message) {
        logger.error("message not found")
        throw new Error("message is required")
    }

    await prisma.log.create({
        data: {
            taskId,
            step,
            message,
            meta
        }
    })
}

module.exports = {
    updateLogs
}