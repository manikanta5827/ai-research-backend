const { verifyAuthToken } = require("../services/authService.js");
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const authHandler = async(req,res,next) => {
    const authToken = req.headers['auth-token'];

    if(!authToken) {
        return res.status(400).json({
            status: "error",
            message: "Auth token required"
        })
    }

    // validate the auth token
    const response = verifyAuthToken(authToken);
    if(!response.status) {
        return res.status(401).json({
            status: "error",
            message: response.data || "Invalid Token"
        })
    }

    // keep the user data in req body
    const user = await prisma.user.findUnique({
        where: {
            id
        }
    })

    if(!user) {
        return res.status(404).json({
            status: "error",
            message: "user not found"
        })
    }
    req.user = user;
    next();
}

module.exports = authHandler;