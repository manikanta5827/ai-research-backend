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
const MAX_WEB_REQUESTS = 10;

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
    console.log(`searching in web using duck duck go`);
    await updateLogs(id, 'Web Search', `Querying duck duck for top ${MAX_WEB_REQUESTS} urls`, { "url": `https://duckduck.com/${topic}` });

    const body = {
        topic,
        "max_results": MAX_WEB_REQUESTS
    }
    const headers = {
        "Content-Type": "application/json"
    }

    let { data } = await axios.post(`${FAST_API_MICROSERVICE_PATH}/search`, body, { headers });
    console.log(`got response from fast api service`);

    if (data.length == 0) {
        logger.info(`zero results found for the topic ${topic}`);
        throw new Error(`zero results found for the topic ${topic}`);
    }

    // filter wbsites which return empty content or null
    data = data.filter((webpage, index) => {
        if (webpage.title == null || webpage.title === "" || webpage.content == null || webpage.content === "") {
            console.log(`skipping index ${index} of url ${webpage.url} because of empty content`)
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

async function generateSummaryUsingLLM(topic, title, content) {

    if (!title) {
        throw new Error("title not provided in generateSummaryUsingLLM function");
    }

    if (!content) {

        throw new Error("content not provided in generateSummaryUsingLLM function");
    }
    // send content to llm and ask for keywords and summary in 1-2 lines
    const prompt = `{
        instructions: "Analyze the given webpage content based on the inputs.",
        inputs: {
          topic: ${topic},
          title: ${title},
          content: ${content}
        },
        requirements: {
          summary: "Generate a concise summary (exactly 3–5 lines) of the webpage content, relevant to the topic.",
          keywords: "Extract the main keywords from the content as an array of strings of 2.",
          validation: "If the webpage content and the title are not aligned or do not match, return only { \"error\": true }."
        },
        response_format: {
          valid: {
            summary: "string (3–5 lines)",
            keywords: ["string", "string", "..."] of size 2
          },
          error: {
            error: true
          }
        }
      }`;
    ;

    return await generateResponse(prompt);
}

async function generateSingleSummary(topic, summary, keywords) {

    if (!summary) {
        throw new Error("summary not provided in generateSingleSummary function");
    }

    if (!keywords) {
        throw new Error("keywords not provided in generateSingleSummary function");
    }

    const prompt = `{
        instructions: "Combine multiple webpage summaries and keywords into a single output relevant to the given topic.",
        inputs: {
          topic: ${topic},
          summaries: ${summary},   // array of summaries
          keywords: ${keywords}    // array of keywords
        },
        requirements: {
          summary: "Generate one concise summary (5–7 lines) that captures the overall meaning from all provided summaries, ensuring it is relevant to the topic.",
          keywords: "Merge and deduplicate all keywords into a single array of the most important ones of upto 5 words."
        },
        response_format: {
          valid: {
            summary: "string (5–7 lines)",
            keywords: ["string", "string", "..."] of size 5
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

        if (response.error == true || !response.summary || !Array.isArray(response.keywords)) {
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

module.exports = { validateTopic, searchUsingDuckDuck, generateSummaryUsingLLM, generateSingleSummary };