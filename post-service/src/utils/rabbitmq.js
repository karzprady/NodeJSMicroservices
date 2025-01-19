const amqp = require('amqplib');
const logger = require('./logger');

let channel = null;
let connection = null;

const EXCHANGE_NAME = "facebook_events";

// Helper function to retry connection to RabbitMQ
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

// Publish event to RabbitMQ
async function publishEvent(routingKey, message) {
    try {
        if (!channel) {
            logger.info("Channel is not available, reconnecting to RabbitMQ...");
            await connectToRabbitMQ(); // Ensure we have a valid connection/channel
        }

        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
        logger.info(`Event published with routing key: ${routingKey}`);
    } catch (e) {
        logger.error("Error publishing event to RabbitMQ", e.message, e.stack);
    }
}

// Graceful shutdown handler for RabbitMQ connections/channels
async function closeConnection() {
    try {
        if (channel) {
            await channel.close();
            logger.info("RabbitMQ channel closed");
        }
        if (connection) {
            await connection.close();
            logger.info("RabbitMQ connection closed");
        }
    } catch (e) {
        logger.error("Error closing RabbitMQ connection", e.message, e.stack);
    }
}

// Ensure graceful shutdown when the process exits
process.on('SIGINT', async () => {
    logger.info("Shutting down server...");
    await closeConnection();
    process.exit(0);
});

module.exports = { connectToRabbitMQ, publishEvent, closeConnection };
