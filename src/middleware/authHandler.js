
const authHandler = async(req, res, next) =>{
    const userId = req.headers['userId'];

    if(!userId) {
        return res.status(400).json({
            status: "error",
            message: "user id required"
        })
    }
    req.userId = userId;
    next();
}

module.exports = authHandler;