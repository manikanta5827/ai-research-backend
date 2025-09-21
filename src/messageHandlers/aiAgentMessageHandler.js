const { logger } = require("../utils/winstonLogger");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const aiAgentMessageHandler = async (job) => {
    const topic = job.data.topic;
    // validate the topic if it is less than 3 words then don't search


    return { result: "Done", taskId: job.data.id };

}

async function updateLogs(taskId, step, message, meta = {}) {
    if (!taskId) {
        logger.error("taskId not found")
        throw new Error("taskId not found");
    }

    if (!step) {
        logger.error("step not found")
        throw new Error("step not found");
    }

    if (!message) {
        logger.error("message not found")
        throw new Error("message not passed")
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

module.exports = aiAgentMessageHandler;