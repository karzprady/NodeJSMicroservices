const logger= require("../utils/logger")
const authenticateReq = (req,res,next)=>{
    const userId = req.headers['x-user-id']
    
    if(!userId){
        logger.error("attempted without being authencitaed")
        return res.status(403).json({
            message :"you are not loggedin "
        })
    }
    req.user = {userId}
    next()
}

module.exports = authenticateReq