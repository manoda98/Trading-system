const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const kafka = new Kafka({
    clientId: 'order-manager',
    brokers: ['localhost:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const producer = kafka.producer({
    allowAutoTopicCreation: false,
    maxInFlightRequests: 1,
    idempotent: true
});

const consumer = kafka.consumer({
    groupId: 'order-manager-group',
    allowAutoTopicCreation: false
});

const pendingRequests = new Map();

async function startConsumer() {
    await consumer.connect(),
    await consumer.subscribe({
        topic: 'ME_OUT',
        fromBeginning: false
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message}) => {
            try {
                const data = JSON.parse(message.value.toString());

                if (data.requestId && pendingRequests.has(data.requestId)) {
                    const { resolve, reject } = pendingRequests.get(data.requestId);
                    pendingRequests.delete(data.requestId);

                    if (data.status === 'SUCCESS') {
                        resolve(data.payload);
                    } else {
                        reject(new Error(data.error || 'Request failed'));
                    }
                }
            } catch (error) {
                console.error('Error processing response: ', error);
            }
        }
    });
}

async function sendRequest(messageType, payload, timeout = 15000) {
    const requestId = uuidv4();

    return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });

        const timeoutId = setTimeout(() => {
           if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
           } 
        }, timeout);

        const originalResolve = resolve;
        const originalReject = reject;
        pendingRequests.set(requestId, {
            resolve: (value) => {
                clearTimeout(timeoutId);
                originalResolve(value);
            },
            reject: (error) => {
                clearTimeout(timeout);
                originalReject(error);
            }
        });

        producer.send({
            topic: 'ME_IN',
            message: [{
                key: requestId,
                value: JSON.stringify({
                    messageType,
                    requestId,
                    timestamp: new Date().toISOString(),
                    payload
                })
            }]
        }).catch((error) => {
            pendingRequests.delete(requestId);
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

async function initialize() {
    await producer.connect();
    console.log('Kafka producer connected');
    await startConsumer();
    console.log('Kafka consumer started');
}

module.exports = {
    producer,
    consumer,
    sendRequest,
    initialize
};


