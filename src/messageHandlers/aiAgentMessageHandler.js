const { Worker } = require('bullmq');
const connection = { host: '127.0.0.1', port: 6379 };

const worker = new Worker(
  'ai-agent-queue',
  async job => {
    console.log('Processing job:', job.id, job.data);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Job completed:', job.id);
    return { result: 'Done' };
  },
  { connection }
);

worker.on('completed', job => {
  console.log(`Job ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
