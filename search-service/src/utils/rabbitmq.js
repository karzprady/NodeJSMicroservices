const amqp = require('amqplib')
const logger = require('./logger')

let channel = null
let connection = null

let EXCHANGE_NAME = "facebook_events"

async function connectToRabbitMQ() {
    try{
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME,'topic',{durable : false})
        logger.info("RabbitMQ connected")
        return channel
    }
    catch(e){
        logger.error("Some error occured while connecting to rabbit MQ",e)
    }
    
}

async function ConsumeEvent(routingKey,callback){
    if(!channel){
        await connectToRabbitMQ()

    }
    const q = await channel.assertQueue("",{exclusive : true})
    await channel.bindQueue(q.queue,EXCHANGE_NAME,routingKey)

    channel.consume(q.queue,(msg)=>{
        if(msg!==null){
            const content = JSON.parse(msg.content.toString())
            callback(content)
            channel.ack(msg)
        }
    })
    logger.info(`subscribed to event routing key ${routingKey}`)
   
    
}

module.exports = {connectToRabbitMQ,ConsumeEvent}