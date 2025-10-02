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
    logger.info(`pushed task to queue ${task.id}`);

    res.status(201).json({
        status: "success",
        message: "topic added to queue",
        taskId: task.id
    })
}

const listAllTopics = async (req, res) => {
    const user = req.user;

    const topics = await prisma.task.findMany({
        where: {
            user
        }
    })

    if (!topics) {
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

const getTopic = async (req, res) => {
    const user = req.user;

    const topicId = req.get('topic_id');

    if (!topicId || topicId === "") {
        return res.status(404).json({
            status: "error",
            message: "topicId is required"
        })
    }

    const topic = await prisma.task.findFirst({
        where: {
            id: topicId,
            user: user
        },
        select: {
            user: true,
            topic: true,
            status: true,
            progress: true,
            createdAt: true,
            completedAt: true,
            error: true,
            logs: {
                select: {
                    step: true,
                    message: true,
                    meta: true,
                    createdAt: true
                }
            }
        }
    });

    // console.log(JSON.stringify(topic));

    if (!topic) {
        return res.status(404).json({
            status: "error",
            message: "topic not found"
        })
    }

    return res.status(200).json({
        status: "success",
        message: "topic found",
        topic: topic
    })
}

const getResult = async (req, res) => {
    const topicId = req.get('topic_id');

    if (!topicId || topicId === "") {
        return res.status(404).json({
            status: "error",
            message: "topicId is required"
        })
    }

    const result = await prisma.taskResult.findFirst({
        where: {
            taskId: topicId
        }
    })

    if (!result) {
        return res.status(404).json({
            status: "error",
            message: "topic not found"
        })
    }

    return res.status(200).json({
        status: "success",
        message: "result fetched successfully",
        result: result.result
    })
}

const deleteTopic = async (req, res) => {
    const user = req.user;

    const topicId = req.get('id');

    if (!topicId || topicId === "") {
        return res.status(404).json({
            status: "error",
            message: "topicId is required"
        })
    }

    const topic = await prisma.task.findUnique({
        where: {
            id: topicId,
            user: user
        }
    })

    if (!topic) {
        return res.status(404).json({
            status: "error",
            message: "topic not found"
        })
    }

    await prisma.task.delete({
        where: {
            id: topic.id
        }
    })

    return res.status(200).json({
        status: "success",
        message: "topic deleted successfully"
    })
}

module.exports = {
    triggerResearch,
    listAllTopics,
    getTopic,
    getResult,
    deleteTopic
};