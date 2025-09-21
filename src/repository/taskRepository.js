const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isValidTaskStatus } = require('../enums/taskStatusEnum.js');
const { logger } = require('../utils/winstonLogger.js');

async function updateProgress(id, progress, status, completedAt = false, error = null) {
    logger.info(`id::${id}, progress:: ${progress}, status::${status}`);
    if (!id) {
        throw new Error("taskid is required");
    }

    if (progress !== undefined && typeof progress != 'number') {
        throw new Error("progress should be Number");
    }

    if (!status || status == "") {
        throw new Error("status shouldn't be empty");
    }

    if (!isValidTaskStatus(status)) {
        throw new Error(`Not a valid status::${status}`);
    }

    let data = {
        status: status
    }

    if (progress !== undefined) {
        data.progress = progress;
    }

    if (completedAt) {
        data.completedAt = new Date();
    }

    if (error) {
        logger.info(`error::${error || "something went wrong"}`);
        data.error = (error instanceof Error ? error.message : error) ?? "Something went wrong";
    }

    await prisma.task.update({
        where: { id },
        data: data
    })
}

module.exports = { updateProgress };