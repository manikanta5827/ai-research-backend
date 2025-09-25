
const authHandler = async(req, res, next) =>{
    const user = req.headers['user']; 

    if(!user) {
        return res.status(401).json({
            status: "error",
            message: "user id required"
        })
    }
    req.user = user;
    next();
}

module.exports = authHandler;