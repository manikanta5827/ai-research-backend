const { Worker } = require('bullmq');
const connection = { host: '127.0.0.1', port: 6379 };
const {logger} = require('../utils/winstonLogger.js');
const aiAgentMessageHandler = require('../messageHandlers/aiAgentMessageHandler.js');

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

worker.on('stalled', (jobId) => {
  logger.warn(`Job ${jobId} has stalled`);
});

worker.on('progress', (job, progress) => {
  logger.info(`Job ${job.id} progress: ${progress}%`);
});

worker.on('completed', job => {
  logger.info(`Job ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

worker.on('connectionError', (err) => {
  logger.error('Worker connection error:', err);
});
