const { Worker } = require('bullmq');
const connection = { host: '127.0.0.1', port: 6379 };
const {logger} = require('../utils/winstonLogger.js');

const worker = new Worker(
  'ai-agent-queue',
  async job => {
    logger.info('Processing job:', job.id, job.data);

    try {
      await job.updateProgress(10);
      logger.info('Job started - 10% complete');

      await new Promise(resolve => setTimeout(resolve, 1000));

      await job.updateProgress(50);
      logger.info('Halfway through - 50% complete');

      await new Promise(resolve => setTimeout(resolve, 1000));

      await job.updateProgress(90);
      logger.info('Almost done - 90% complete');

      await new Promise(resolve => setTimeout(resolve, 500));

      await job.updateProgress(100);
      logger.info('Job completed:', job.id);

      return { result: 'Done', taskId: job.data.id };
    } catch (error) {
      logger.error('Job processing failed:', error);
      throw error;
    }
  },
  { connection }
);

worker.on('ready', () => {
  logger.info('Worker is ready and listening for jobs');
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
