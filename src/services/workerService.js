const { Worker } = require('bullmq');
require('dotenv').config();
const { logger } = require('../utils/winstonLogger.js');

const REDIS_HOST_URL = process.env.REDIS_HOST_URL;

if (!REDIS_HOST_URL) {
  throw new Error("redis host is not specified in env file")
}

const connection = { host: REDIS_HOST_URL, port: 6379 };
const aiAgentMessageHandler = require('../messageHandlers/aiAgentMessageHandler.js');
const { taskStatus } = require('../enums/taskStatusEnum.js');
const { updateProgress } = require('../repository/taskRepository.js');

const worker = new Worker(
  'myQueue',
  async job => {
    logger.info(`Processing job ${job.name}`);

    switch (job.name) {
      case 'ai-agent-queue':
        return await aiAgentMessageHandler(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  { connection }
);

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs');
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

worker.on('stalled', async (jobId) => {
  logger.warn(`Job ${jobId} has stalled`);
});

worker.on('progress', (job, progress) => {
  logger.info(`Job ${job.id} progress: ${progress}%`);
});

worker.on('completed', job => {
  logger.info(`Job ${job.id} has been completed`);
});

worker.on('failed', async (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
  await updateProgress(job.data.id, 0, taskStatus.FAILED, true, err);
});

worker.on('connectionError', (err) => {
  logger.error('Worker connection error:', err);
});
