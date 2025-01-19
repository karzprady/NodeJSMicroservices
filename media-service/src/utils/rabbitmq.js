const amqp = require('amqplib');
const logger = require('./logger');

let channel = null;
let connection = null;

const EXCHANGE_NAME = "facebook_events";

// Function to handle RabbitMQ connection retries
async function connectToRabbitMQ() {
    let attempts = 5; // Number of retry attempts
    while (attempts > 0) {
        try {
            logger.info("Attempting to connect to RabbitMQ...");
            connection = await amqp.connect(process.env.RABBITMQ_URL);
            channel = await connection.createChannel();

            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
            logger.info("RabbitMQ connected");

            // Attach error listeners
            connection.on('error', (err) => {
                logger.error('RabbitMQ connection error:', err.message);
            });

            channel.on('error', (err) => {
                logger.error('RabbitMQ channel error:', err.message);
            });

            // Ensure that the connection closes gracefully on shutdown
            connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
            });

            return channel;
        } catch (e) {
            attempts -= 1;
            logger.error(`Error connecting to RabbitMQ. Attempts left: ${attempts}`, e.message, e.stack);

            if (attempts === 0) {
                logger.error("Failed to connect to RabbitMQ after multiple attempts.");
                throw new Error("Failed to connect to RabbitMQ");
            }

            logger.info("Retrying in 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Retry every 5 seconds
        }
    }
}

// To publish events to RabbitMQ
async function publishEvent(routingKey, message) {
    try {
        if (!channel) {
            await connectToRabbitMQ();  // Ensure the connection is established
        }
        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
        logger.info(`Event published with routing key: ${routingKey}`);
    } catch (e) {
        logger.error("Error publishing event to RabbitMQ", e.message, e.stack);
    }
}

// To consume events from RabbitMQ
async function consumeEvent(routingKey, callback) {
    try {
        if (!channel) {
            await connectToRabbitMQ();  // Ensure the connection is established
        }

        const q = await channel.assertQueue("", { exclusive: true });
        await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content);  // Call the provided callback
                channel.ack(msg);  // Acknowledge the message
            }
        });
        logger.info(`Subscribed to event with routing key: ${routingKey}`);
    } catch (e) {
        logger.error("Error consuming event from RabbitMQ", e.message, e.stack);
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

process.on('SIGTERM', async () => {
    logger.info("Server terminating...");
    await closeConnection();
    process.exit(0);
});

module.exports = { connectToRabbitMQ, publishEvent, consumeEvent, closeConnection };
