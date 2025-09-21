const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { taskStatus } = require('../enums/taskStatusEnum.js');
const myQueue = require('../services/queueService.js');
const { logger } = require('../utils/winstonLogger.js');

const triggerResearch = async (req, res) => {
    const topic = req.get('topic');

    if (!topic) {
        return res.status(400).json({
            status: "error",
            message: "topic should not be empty"
        })
    }

    logger.info('creating task');
    const task = await prisma.task.create({
        data: {
            user: req.user,
            topic: topic,
            status: taskStatus.PENDING
        }
    })

    // now push it into queue
    myQueue.add('ai-agent-queue', task);
    logger.info('pushed task to queue');

    res.status(201).json({
        status: "success",
        message: "topic added to queue",
        taskId: task.id
    })
}

const listAllTopics = async (req,res) => {
    const user = req.user;

    const topics = await prisma.task.findMany({
        where:{
            user
        }
    })

    if(!topics) {
        return res.status(200).json({
            status: "success",
            message: "no topics found"
        })
    }

    return res.status(200).json({
        status: "success",
        message: "topics found",
        topics
    })
}

module.exports = {
    triggerResearch,
    listAllTopics
};