require("dotenv").config()
const express = require('express')
const mongoose = require('mongoose')
const redisClient = require("./redisclient/redis")
const cors = require('cors')
const helmet = require('helmet')
const {connectToRabbitMQ,ConsumeEvent} = require('./utils/rabbitmq')
const ErrorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')
const router = require("./routes/search-routes")
const {SearchEvent,searchDeleteEvent} = require("./EventHandlers/eventHandlers")

const app = express()
const PORT = process.env.PORT


mongoose.connect(process.env.MONGO_URI).then(()=>logger.info("db started")).catch(e=>logger.error("db error",e))


app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{
    logger.info(`Received method ${req.method} and url ${req.url}`)
    next()
})

//redis client



app.use((req,res,next)=>{
    req.redisClient = redisClient
    next()
})

app.use("/api/search",router)
//ratelimiting for sensitive endpoints


app.use(ErrorHandler)

async function StartServer(){
    try{
        await connectToRabbitMQ()
        await ConsumeEvent("post.created",SearchEvent)
        await ConsumeEvent("post.deleted",searchDeleteEvent)
        app.listen(PORT,()=>{
            logger.info(`Search service started ${PORT}`)
        })

    }
    catch(e){
        logger.error("search didnt start",e.stack,e.message)
        
    }
}

StartServer()

process.on('unhandledRejection',(reason,promise)=>{
    logger.error("some rejection",reason)
})