const axios = require('axios');
const { GoogleGenAI } = require("@google/genai");
const { updateLogs } = require('../repository/logsRepository.js');
const { updateProgress } = require('../repository/taskRepository.js');
const { taskStatus } = require('../enums/taskStatusEnum.js');
const { logger } = require('../utils/winstonLogger.js');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("Gemini api key not found in env file")
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const FAST_API_MICROSERVICE_PATH = process.env.FAST_API_MICROSERVICE_PATH || "http://localhost:8000";
const MIN_TOPIC_LENGTH = 3;
const MAX_WEB_REQUESTS = 5;

const RESEARCH_SITES = [
    'reddit.com',
    'stackoverflow.com',
    'wikipedia.org',
    'medium.com',
    'github.com',
    'dev.to',
    'quora.com'
];

if (!FAST_API_MICROSERVICE_PATH) {
    throw new Error("FAST_API_MICROSERVICE_PATH is not defined in env file");
}

async function validateTopic(id, topic) {
    // validate the topic if it is less than 3 words then don't search
    await updateLogs(id, 'Input Parse', "validated topic", { topic: topic });

    if (topic.length < MIN_TOPIC_LENGTH) {
        await updateLogs(id, 'Input Parse', `topic should me more than ${MIN_TOPIC_LENGTH} characters`, { "topic_length": topic.length })
        throw new Error(`topic should me more than ${MIN_TOPIC_LENGTH} characters`);
    }

    // if topic length is correct update progress
    await updateProgress(id, 10, taskStatus.RUNNING);
}

async function searchUsingDuckDuck(id, topic) {
    logger.info(`searching in web using duck duck go`);
    
    // Construct site-specific query
    const siteQuery = RESEARCH_SITES.map(site => `site:${site}`).join(' OR ');
    const enrichedTopic = `(${siteQuery}) ${topic}`;

    await updateLogs(id, 'Web Search', `Querying duck duck for top ${MAX_WEB_REQUESTS} urls`, { "query": enrichedTopic });

    const body = {
        topic: enrichedTopic,
        "max_results": MAX_WEB_REQUESTS
    }
    const headers = {
        "Content-Type": "application/json"
    }

    let { data } = await axios.post(`${FAST_API_MICROSERVICE_PATH}/search`, body, { headers });
    logger.info(`got response from fast api service`);

    if (data.length == 0) {
        logger.info(`zero results found for the topic ${topic}`);
        throw new Error(`zero results found for the topic ${topic}`);
    }

    // filter wbsites which return empty content or null
    data = data.filter((webpage, index) => {
        if (webpage.title == null || webpage.title === "" || webpage.content == null || webpage.content === "") {
            logger.info(`skipping index ${index} of url ${webpage.url} because of empty content`)
            return false;
        }
        return true;
    })

    // get only urls from the response
    let urls = [];
    data.forEach(webpage => {
        urls.push(webpage.url);
    })
    console.table(urls);

    await updateLogs(id, 'Web Search', `Extracting content from ${urls.length} websites`, { "urls": urls });

    await updateProgress(id, 50, taskStatus.RUNNING);

    return data;
}

async function generateCombinedAnalysis(topic, articles) {
    if (!articles || articles.length === 0) {
        throw new Error("No articles provided for analysis");
    }

    const articlesInput = articles.map(a => ({
        url: a.url,
        title: a.title,
        content: a.content
    }));

    const prompt = `{
        instructions: "You are an expert researcher. Analyze the provided ${articles.length} web articles related to the topic '${topic}'. Return a SINGLE JSON object containing a summary for EACH article and a final synthesized overview.",
        inputs: {
            topic: "${topic}",
            articles: ${JSON.stringify(articlesInput)}
        },
        requirements: {
            article_analysis: "For each article in the input array, provide a summary (3-5 lines) and 2 keywords. If the content is irrelevant or error-prone, mark error: true.",
            final_synthesis: "Generate one concise master summary (5-7 lines) that captures the overall meaning from all valid articles. Merge and deduplicate keywords into a single array of top 5 keywords."
        },
        response_format: {
            articles: [
                {
                    url: "string (must match input url)",
                    title: "string (must match input title)",
                    summary: "string (3-5 lines)",
                    keywords: ["string", "string"],
                    error: false
                }
            ],
            final_synthesis: {
                overview: "string (5-7 lines)",
                keywords: ["string", "string", "string", "string", "string"]
            }
        }
    }`;

    return await generateResponse(prompt);
}

async function generateResponse(prompt) {
    let { text: response } = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
    });

    let cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .replace(/^\s*```json\s*/gm, '')
        .replace(/```\s*$/gm, '')
        .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        cleaned = jsonMatch[0];
    }

    try {
        response = JSON.parse(cleaned);

        if (!response || typeof response !== 'object') {
            throw new Error('response is not a valid object');
        }

        if (response.error === true) {
            return {
                status: false
            }
        }

        response.status = true;
        return response;
    } catch (err) {
        console.error(`failed to parse LLM response as JSON: ${err?.message}\nRaw: ${response}\nCleaned: ${cleaned}`);

        return {
            status: false
        }
    }
}

module.exports = { validateTopic, searchUsingDuckDuck, generateCombinedAnalysis };