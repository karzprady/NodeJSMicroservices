const logger = require("../utils/logger")
const jwt = require('jsonwebtoken')

const validateToken = (req,res,next)=>{
    const authheader = req.headers['authorization']
    const token = authheader && authheader.split(' ')[1]
    if(!token){
        logger.error('accessed with out valid token')
        return res.status(500).json({
            success : false,
            message : "token invalid"
        })
    }

    jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if(err){
            logger.error('accessed with out valid token')
        return res.status(429).json({
            success : false,
            message : "token invalid"
        })
    }

        req.user = user
        next()
            

        
    })
}

module.exports = validateToken