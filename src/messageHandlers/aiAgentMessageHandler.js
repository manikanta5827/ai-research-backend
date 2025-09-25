const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require('dotenv').config();
const { logger } = require('../utils/winstonLogger.js');
const { updateLogs } = require('../repository/logsRepository.js');
const { updateProgress } = require('../repository/taskRepository.js');
const { updateFinalTaskResult } = require("../repository/taskResultRepository.js")
const { taskStatus } = require('../enums/taskStatusEnum.js');
const { validateTopic, searchUsingDuckDuck, generateSummaryUsingLLM, generateSingleSummary } = require('../services/aiAgentMessageHandlerService.js');


const aiAgentMessageHandler = async (job) => {
    try {
        const { id, topic } = job.data;

        // validate the topic
        await validateTopic(id, topic);

        // fetch content from websites using duck duck fast api server
        const data = await searchUsingDuckDuck(id, topic);

        let final_response = {
            topic: topic,
            articles: [],
            final_synthesis: {
                overview: "",
                keywords: []
            }
        };

        let keywords = [];
        let summary = [];
        // hit llm for every web page to get summary
        await Promise.all(data.map(async (webpage, index) => {
            const response = await generateSummaryUsingLLM(topic, webpage.title, webpage.content);

            final_response.articles.push({
                url: webpage.url,
                title: webpage.title,
                summary: response.summary,
                keywords: response.keywords
            })

            summary.push(response.summary);
            keywords.push(response.keywords);
        }))
        console.log('succesfully hit all llm api calls');
        await updateProgress(id, 75, taskStatus.RUNNING);

        await updateLogs(id, 'AI Summarization', `Generating single summary from all webpages`, {
            "api": "Gemini"
        });

        // hit single llm api to get final summary
        const response = await generateSingleSummary(topic, summary, keywords);
        final_response.final_synthesis.overview = response.summary;
        final_response.final_synthesis.keywords = response.keywords;

        await updateProgress(id, 100, taskStatus.SUCCEEDED, true);
        await updateFinalTaskResult(id, final_response);

        console.log(`topic fetching completed for the job of id::${job.id}`);
        return { result: "topic fetching completed", taskId: id };
    } catch (error) {
        logger.info(`Error happened in job id:: ${job.id} due to ${error.message}`);
        await updateProgress(job.data.id, 0, taskStatus.FAILED, true, error.message);
        await updateFinalTaskResult(job.data.id, { error: error.message })
    }
}

module.exports = aiAgentMessageHandler;