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

// Handle subscriptions and send a welcome message
aedes.on('subscribe', (subscriptions, client) => {
    if (client) {
        const clientTopic = `mqtt/${client.id}`;
        console.log(`Client ${client.id} subscribed to: ${subscriptions.map(sub => sub.topic).join(', ')}`);

        // Send welcome message ONLY to the client subscribing
        const welcomeMessage = `Hello ${client.id}, welcome to your dedicated topic: ${clientTopic}`;
        aedes.publish(
            {
                topic: clientTopic,
                payload: welcomeMessage,
                qos: 1,
                retain: false
            },
            client, // Send only to this client
            () => console.log(`Welcome message sent to ${client.id} on topic ${clientTopic}`)
        );
    }
});

// Suppress self-published messages
aedes.authorizeForward = (client, packet) => {
    // Block messages from being sent back to the same client
    if (!client && packet.topic === `mqtt/${client.id}`) {
        console.log(`Blocking self-published message from ${client.id} on topic ${packet.topic}`);
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
