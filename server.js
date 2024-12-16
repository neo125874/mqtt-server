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

// Send welcome message to new client
aedes.on('client', (client) => {
    console.log(`Client connected: ${client.id}`);

    const welcomeTopic = `welcome/${client.id}`;
    const welcomeMessage = `Hello ${client.id}, welcome to the MQTT broker!`;

    aedes.publish(
        {
            topic: welcomeTopic,   // Send the welcome message on a personalized topic
            payload: welcomeMessage,
            qos: 1,                // At least once delivery
            retain: false,         // Do not retain this message
        },
        client, // Send only to the connecting client
        (err) => {
            if (err) {
                console.error(`Failed to send welcome message to ${client.id}:`, err);
            } else {
                console.log(`Welcome message sent to ${client.id} on topic ${welcomeTopic}`);
            }
        }
    );
});

// Prevent broadcast of client-published messages to other subscribers
aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`Message received from ${client.id}: ${packet.payload.toString()} on topic ${packet.topic}`);
        
        // Process the message (e.g., log or save to a database)
        saveToDatabase(client.id, packet.topic, packet.payload.toString());

        // Do NOT broadcast the message to other subscribers
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
