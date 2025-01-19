const amqp = require('amqplib');
const logger = require('./logger');

let channel = null;
let connection = null;

let EXCHANGE_NAME = "facebook_events";

// Helper function to retry connection if RabbitMQ is not available
async function connectToRabbitMQ() {
    let attempts = 5; // Retry limit
    while (attempts > 0) {
        try {
            logger.info("Attempting to connect to RabbitMQ...");
            connection = await amqp.connect(process.env.RABBITMQ_URL);
            channel = await connection.createChannel();

            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
            logger.info("RabbitMQ connected");

            return channel;
        } catch (e) {
            attempts -= 1;
            logger.error(`Error connecting to RabbitMQ. Attempts left: ${attempts}`, e.message, e.stack);

            if (attempts === 0) {
                logger.error("Failed to connect to RabbitMQ after multiple attempts.");
                throw new Error("Failed to connect to RabbitMQ");
            }

            // Retry after 5 seconds
            logger.info("Retrying in 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Consume events from RabbitMQ with routing key
async function ConsumeEvent(routingKey, callback) {
    try {
        if (!channel || !connection) {
            logger.info("Channel or connection not available, reconnecting...");
            await connectToRabbitMQ(); // Ensure a valid connection/channel
        }

        const q = await channel.assertQueue("", { exclusive: true });
        await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content);
                channel.ack(msg);  // Acknowledge the message once it has been processed
            }
        });
        
        logger.info(`Subscribed to event with routing key: ${routingKey}`);
    } catch (e) {
        logger.error("Error consuming event", e.message, e.stack);
    }
}

// Graceful shutdown handler for RabbitMQ connections/channels
async function closeConnection() {
    if (channel) {
        await channel.close();
        logger.info("RabbitMQ channel closed");
    }
    if (connection) {
        await connection.close();
        logger.info("RabbitMQ connection closed");
    }
}

// Ensure that connection is closed when the process exits
process.on('SIGINT', async () => {
    logger.info("Shutting down server...");
    await closeConnection();
    process.exit(0);
});

module.exports = { connectToRabbitMQ, ConsumeEvent, closeConnection };
