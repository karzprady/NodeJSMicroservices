const express = require('express')
require('dotenv').config()

const helmet = require('helmet')
const cors = require('cors')
const logger = require('./utils/logger')
const errorHandler = require('./middleware/errorHandler')
const redis = require('ioredis')
const app = express()
const redisClient = new redis.Redis(process.env.REDIS_CLIENT)
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const proxy = require('express-http-proxy')
const validateToken = require('./middleware/authmiddleware')

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Received method ${req.method} and url ${req.url}`)
    next()
})

//ratelimiting

const rateLimiterOptions = rateLimit({
    windowMs : 15*60*1000,
    max : 100,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req,res)=>{
        logger.warn(`rate limit exceed for ip : ${req.ip}`)
        res.status(500).json({
            message : "too many requests"
        })
    },
    store : new RedisStore({
        sendCommand : (...args)=>redisClient.call(...args)
    })
})

app.use(rateLimiterOptions)

//proxy

const proxyOptions = {
proxyReqPathResolver : (req)=>{
    return req.originalUrl.replace(/^\/v1/,"/api")
},
proxyErrorHandler : (err,res,next)=>{
    logger.error(`Proxy error : ${err.message}`)
    res.status(500).json({
        message : err.message,
        error : "internal server error"
    })

}
}

//setting proxy

app.use('/v1/auth',proxy(process.env.IDENTITY_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts,srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts

    },
    userResDecorator : (proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from identity-service ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

//set proxy for post service

app.use('/v1/posts',validateToken,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts,srcReq)=>{
        proxyReqOpts.headers['Content-Type'] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        return proxyReqOpts
    },
    userResDecorator : (proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Received response from post service with status ${proxyRes.statusCode}`)
        return proxyResData

    }
}))

//set proxy for media service
app.use('/v1/media',validateToken,proxy(process.env.MEDIA_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts,srcReq)=>{
        
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
            proxyReqOpts.headers['Content-Type'] = "application/json"
        }
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        return proxyReqOpts
    },
    userResDecorator : (proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Received response from media service with status ${proxyRes.statusCode}`)
        return proxyResData

    },
    parseReqBody : false
}))
//proxy for search

app.use('/v1/search',validateToken,proxy(process.env.SEARCH_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts,srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        return proxyReqOpts

    },
    userResDecorator : (proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from identity-service ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use(errorHandler)

app.listen(process.env.PORT,()=>{ 
    logger.info(`API-GATEWAY STARTED AT PORT ${process.env.PORT}`)
    logger.info(`IDENTITY-SERVICE STARTED AT PORT ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`POST-SERVICE STARTED AT PORT ${process.env.POST_SERVICE_URL}`)
    logger.info(`MEDIA-SERVICE STARTED AT PORT ${process.env.MEDIA_SERVICE_URL}`)
    logger.info(`SEARCH-SERVICE STARTED AT PORT ${process.env.SEARCH_SERVICE_URL}`)
    logger.info(`REDISCLIENT STARTED AT PORT ${process.env.REDIS_CLIENT}`)
})