const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const AUTH_SECRET=process.env.AUTH_SECRET;
if(!AUTH_SECRET) {
    throw new Error("Auth secret is not configured in env file");
}
const AUTH_TOKEN_EXPIRES_IN = "100h"

export const generateAuthToken = (user) => {
   return jwt.sign({ id: user.id }, AUTH_SECRET, { expiresIn: AUTH_TOKEN_EXPIRES_IN });
}

export const verifyAuthToken = (token) => {
    try {
        const decoded = jwt.verify(token, AUTH_SECRET);
        return {
            status: true,
            data: decoded
        }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return {
                status: false,
                data: "Token Expired"
            }
        }
        return {
            status: false,
            data: "Token Invalid"
        }
    }
}