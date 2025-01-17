require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const PostRoutes = require("./routes/post-router")
const ErrorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const {connectToRabbitMQ} = require('./utils/rabbitmq')

const app = express()

mongoose.connect(process.env.MONGO_URI).then(()=>logger.info("db started")).catch(e=>logger.error("db error",e))

const redisClient = new redis.Redis(process.env.REDIS_CLIENT)

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{
    logger.info(`Received method ${req.method} and url ${req.url}`)
    next()
})

//ratelimiting for sensitive endpoints

const ratelimiterOptions = rateLimit({
    windowMs : 15*60*1000,
    max : 100,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req,res)=>{
        logger.warn(`Rate limit exceeded for ip ${req.ip}`)
        res.status(500).json({
            message : "rate limit exceeded"
        })

    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args)
    })
})

app.use("/api/posts",ratelimiterOptions)

//routes->passredisclient to routes

app.use("/api/posts",(req,res,next)=>{
    req.redisClient = redisClient
    next()
},PostRoutes)

app.use(ErrorHandler)

async function startserver() {
    try{
        await connectToRabbitMQ()
        app.listen(process.env.PORT,()=>{
            logger.info(`post service started at PORT ${process.env.PORT}`)
        })

    }
    catch(e){

        logger.info("failed to start servers",e)
        process.exit(1)

    }
    
}

startserver()



process.on("unhandledRejection",(reason,promise)=>{
    logger.error(`unhandled rejection on promise ${promise} due to reason ${reason}`)
})