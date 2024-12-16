const aedes = require('aedes')(); // Lightweight MQTT broker library
const http = require('http'); // For WebSocket support
const ws = require('websocket-stream'); // WebSocket stream

const mqttPort = 1883;  // Port for TCP MQTT
const wsPort = 9001;    // Port for WebSocket MQTT

// Create MQTT server over TCP
const tcpServer = require('net').createServer(aedes.handle);
tcpServer.listen(mqttPort, () => {
    console.log(`MQTT server is running on tcp://localhost:${mqttPort}`);
});

// Create WebSocket server
const httpServer = http.createServer();
ws.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(wsPort, () => {
    console.log(`MQTT server is running on ws://localhost:${wsPort}`);
});

// Handle subscriptions and send welcome message
aedes.on('subscribe', (subscriptions, client) => {
    if (client) {
        console.log(`Client ${client.id} subscribed to: ${subscriptions.map(sub => sub.topic).join(', ')}`);

        // Check if the client subscribed to a specific topic
        subscriptions.forEach((sub) => {
            const subscribedTopic = sub.topic;

            // Only send a welcome message if the topic matches (or send on any topic)
            if (subscribedTopic === 'public/mqtt') {
                const welcomeMessage = `Hello ${client.id}, you have subscribed to ${subscribedTopic}!`;

                // Publish the welcome message only to the subscribing client
                aedes.publish(
                    {
                        topic: subscribedTopic, // Use the subscribed topic
                        payload: welcomeMessage,
                        qos: 1,                // At least once delivery
                        retain: false,         // Do not retain this message
                    },
                    client, // Send only to this client
                    (err) => {
                        if (err) {
                            console.error(`Failed to send welcome message to ${client.id}:`, err);
                        } else {
                            console.log(`Welcome message sent to ${client.id} on topic ${subscribedTopic}`);
                        }
                    }
                );
            }
        });
    }
});

// Prevent broadcast of client-published messages
aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`Message received from ${client.id}: ${packet.payload.toString()} on topic ${packet.topic}`);
        
        // Process the message (e.g., log or save to a database)
        saveToDatabase(client.id, packet.topic, packet.payload.toString());

        // Prevent broadcasting the message to other subscribers
        console.log(`Broadcasting of message on topic ${packet.topic} has been suppressed.`);
    }
});

// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id}`);
});

// Example function to process or store messages
function saveToDatabase(clientId, topic, payload) {
    console.log(`Saving to database: Client=${clientId}, Topic=${topic}, Payload=${payload}`);
    // Add your database logic here
}
