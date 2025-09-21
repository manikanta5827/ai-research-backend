const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const updateFinalTaskResult = async(taskId, result) =>{

    if(!taskId) {
        throw new Error("taskId is missing");
    }

    if(!result) {
        throw new Error("no result object found");
    }
    
    await prisma.taskResult.create({
        data: {
            taskId: taskId,
            result: result
        }
    })
}

module.exports = { updateFinalTaskResult };