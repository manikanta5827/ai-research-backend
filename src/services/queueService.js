const { Queue } = require('bullmq');
require('cors').config();

const REDIS_HOST_URL= process.env.REDIS_HOST_URL;

if(!REDIS_HOST_URL) {
    throw new Error("redis host is not specified in env file")
}

const connection = { host: REDIS_HOST_URL, port: 6379 };

const myQueue = new Queue('myQueue', { connection });

module.exports = myQueue;
