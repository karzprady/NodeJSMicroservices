require('dotenv').config()
const express = require("express")
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const router = require("./routes/media-routes")
const logger = require('./utils/logger')
const ErrorHandler= require('./middleware/errorHandler')
const {rateLimit} = require('express-rate-limit')
const  {RedisStore} = require('rate-limit-redis')
const redis = require('ioredis')
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq')
const HandlePostdeleted = require('./EventHandlers/mediaeventhandlers')
const redisClient = new redis.Redis(process.env.REDIS_CLIENT)


const app = express()
const PORT =process.env.PORT

mongoose.connect(process.env.MONGO_URI).then(()=>logger.info("db started")).catch(e=>logger.error("some db error",e))

app.use(express.json())
app.use(helmet())
app.use(cors())

app.use((req,res,next)=>{
    logger.info(`Received method ${req.method} and url ${req.url}`)
    next()
})

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

app.use("/api/media",ratelimiterOptions)

app.use("/api/media",router)

app.use(ErrorHandler)

async function startserver() {
    try{
        await connectToRabbitMQ()

        //consume all events

        await consumeEvent('post.deleted',HandlePostdeleted)
        app.listen(process.env.PORT,()=>{
            logger.info(`media service started at PORT ${process.env.PORT}`)
        })

    }
    catch(e){

        logger.error("failed to start media service",e)
        

    }
    
}

startserver()


process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`Unhandled Rejection occured due to ${reason}`)
}) 