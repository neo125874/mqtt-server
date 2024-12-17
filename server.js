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

// Handle client subscriptions and send welcome message
aedes.on('subscribe', (subscriptions, client) => {
    if (client) {
        const clientTopic = `mqtt/${client.id}`; // Unique topic for the client
        console.log(`Client ${client.id} subscribed to: ${subscriptions.map(sub => sub.topic).join(', ')}`);

        // Check if client subscribes to its own unique topic
        if (subscriptions.some(sub => sub.topic === clientTopic)) {
            const welcomeMessage = `Hello ${client.id}, welcome to your dedicated topic: ${clientTopic}`;

            aedes.publish(
                {
                    topic: clientTopic, // Send welcome message to the client's unique topic
                    payload: welcomeMessage,
                    qos: 1,
                    retain: false,
                },
                (err) => {
                    if (err) {
                        console.error(`Failed to send welcome message to ${client.id}:`, err);
                    } else {
                        console.log(`Welcome message sent to ${client.id} on topic ${clientTopic}`);
                    }
                }
            );
        }
    }
});

// Suppress self-published messages
aedes.authorizeForward = (client, packet) => {
    // Suppress messages published by the client to its own topic
    if (client && packet.topic === `mqtt/${client.id}`) {
        console.log(`Suppressing self-published message from ${client.id} on topic ${packet.topic}`);
        return null; // Prevent forwarding to this client
    }
    return packet; // Allow all other messages
};

// Intercept and process client-published messages
aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`Message received from ${client.id}: ${packet.payload.toString()} on topic ${packet.topic}`);

        saveToDatabase(client.id, packet.topic, packet.payload.toString());
    }
});

// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id}`);
});

function saveToDatabase(clientId, topic, payload) {
    console.log(`Saving to database: Client=${clientId}, Topic=${topic}, Payload=${payload}`);
    // Add your database logic here
}
