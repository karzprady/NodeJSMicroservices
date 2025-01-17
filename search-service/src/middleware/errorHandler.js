const logger = require("../utils/logger")

const ErrorHandler = (err,req,res,next)=>{
    logger.error(err.stack)
    res.status(err.statusCode || 500).json({
        message : err.message || 'internal server error'
    })
}

module.exports = ErrorHandler