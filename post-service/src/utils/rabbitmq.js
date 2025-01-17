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

async function publishEvent(routingKey,message) {
    if(!channel){
        await connectToRabbitMQ()

    }
    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)))
    logger.info("eventpublished key is",routingKey)
    
}

module.exports = {connectToRabbitMQ,publishEvent}