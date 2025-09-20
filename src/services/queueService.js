const { Queue } = require('bullmq');
const connection = { host: '127.0.0.1', port: 6379 };

const myQueue = new Queue('myQueue', { connection });

module.exports = myQueue;
