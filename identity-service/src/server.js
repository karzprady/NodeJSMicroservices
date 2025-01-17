const express = require("express")
require("dotenv").config()
const app = express()
const mongoose = require("mongoose")
const logger = require("./utils/logger")
const ErrorHandler = require("./middleware/errorHandler")
const helmet = require("helmet")
const cors = require("cors")
const {RateLimiterRedis} = require('rate-limiter-flexible')
const redis = require("ioredis")
const {rateLimit} = require("express-rate-limit")
const {RedisStore} = require("rate-limit-redis")
const { route } = require("./routes/identity-service")
const router = require("./routes/identity-service")
const redisClient = new redis.Redis(process.env.REDIS_URL)
//db

mongoose.connect(process.env.MONGO_URI).then(()=>logger.info("db connected")).catch(e=>logger.error("mongo connection error",e))

app.use(helmet()) //security purpose - prevents attacks
// app.use(cors({
//     origin : (origin,callback)=>{
//         const allowedlist = ["http://localhost:3000","http://localhost:3001"]
//         if(!origin || allowedlist.indexOf(origin)!==1) callback(null,true)
//         else callback(new Error("not allowed"))
//     },
//     methods : ['GET','POST']
// }
// ))
app.use(cors())

app.use(express.json()) //middleware to parse json requests

app.use((req,res,next)=>{ //logger
    logger.info(`Received method ${req.method} and url ${req.url}`)
    logger.info(`Received req body ${req.body}`)
    next()

})

//DDos protection and rate limiting
const ratelimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : 'middleware',
    points : 10,
    duration : 1
})

app.use((req,res,next)=>{
    ratelimiter.consume(req.ip).then(()=>next()).catch((e)=>{logger.warn(`rate limit exceeded for IP: ${req.ip}`)
     res.status(403).json({
        message : "too many requests"
    })
})
})

//ip based ratelimiting for senstivite endpoints

const endpointsratelimit = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req,res)=>{
        logger.warn(`sensitive endpoints ratelimit exceeded for ip : ${req.ip}`)
        res.status(403).json({
            message : "too many requests"
        })
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args),
    })
})

//apply endpointsratelimit for our routes

app.use("/api/auth/register", endpointsratelimit)

//Routes

app.use("/api/auth",router)

//errorHandler
app.use(ErrorHandler)


app.listen(process.env.PORT,()=>{
    logger.info("server started")
})

//unhandled promise rejection

process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`unhandled rejection at `,promise,"reason:",reason)
})