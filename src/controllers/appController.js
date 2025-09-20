const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const triggerResearch = async(req,res) => {
    const topic = req.get('topic');

    // const 

}


module.exports = {triggerResearch};