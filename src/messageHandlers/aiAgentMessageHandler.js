require('dotenv').config();
const { logger } = require('../utils/winstonLogger.js');
const { updateLogs } = require('../repository/logsRepository.js');
const { updateProgress } = require('../repository/taskRepository.js');
const { updateFinalTaskResult } = require("../repository/taskResultRepository.js")
const { taskStatus } = require('../enums/taskStatusEnum.js');
const { validateTopic, searchUsingDuckDuck, generateCombinedAnalysis } = require('../services/aiAgentMessageHandlerService.js');


const aiAgentMessageHandler = async (job) => {
    try {
        const { id, topic } = job.data;

        // validate the topic
        await validateTopic(id, topic);

        // fetch content from websites using duck duck fast api server
        const data = await searchUsingDuckDuck(id, topic);

        await updateLogs(id, 'AI Summarization', `Analyzing ${data.length} articles and generating synthesis`, {
            "api": "Gemini"
        });
        
        // hit single llm api to get all summaries and final synthesis
        const llmResponse = await generateCombinedAnalysis(topic, data);

        if (!llmResponse.status) {
            throw new Error("Failed to generate analysis from LLM");
        }

        let final_response = {
            topic: topic,
            articles: [],
            final_synthesis: {
                overview: "",
                keywords: []
            }
        };

        if (llmResponse.articles) {
            llmResponse.articles.forEach(article => {
                if (!article.error) {
                    final_response.articles.push(article);
                }
            });
        }

        if (llmResponse.final_synthesis) {
            final_response.final_synthesis = llmResponse.final_synthesis;
        }

        await updateProgress(id, 100, taskStatus.SUCCEEDED, true);
        await updateFinalTaskResult(id, final_response);

        logger.info(`topic fetching completed for the job of id::${job.id}`);
        return { result: "topic fetching completed", taskId: id };
    } catch (error) {
        logger.info(`Error happened in job id:: ${job.id} due to ${error.message}`);
        await updateProgress(job.data.id, 0, taskStatus.FAILED, true, error.message);
        await updateFinalTaskResult(job.data.id, { error: error.message })
    }
}

module.exports = aiAgentMessageHandler;