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

// Handle client connections
aedes.on('client', (client) => {
    console.log(`Client connected: ${client?.id}`);
    
});

aedes.on('subscribe', (subscriptions, client) => {
    console.log(`Client ${client?.id} subscribed to: ${subscriptions.map(sub => sub.topic).join(', ')}`);

    // Check if the subscription includes the target topic (e.g., 'public/mqtt')
    const targetTopic = 'public/mqtt';
    const isSubscribedToTarget = subscriptions.some(sub => sub.topic === targetTopic);

    if (isSubscribedToTarget) {
        const welcomeMessage = `Hello ${client?.id}, welcome to the MQTT broker!`;

        // Publish the welcome message to the subscribed topic
        aedes.publish({
            topic: targetTopic,
            payload: welcomeMessage,
            qos: 1,        // At least once delivery
            retain: false, // No need to retain the welcome message
        }, (err) => {
            if (err) {
                console.error(`Failed to send welcome message to ${client?.id}:`, err);
            } else {
                console.log(`Welcome message sent to ${client?.id} on topic ${targetTopic}`);
            }
        });
    }
});


// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id}`);
});

// Handle messages published to the broker
aedes.on('publish', (packet, client) => {
    console.log(`Message published: ${packet.payload.toString()} on topic: ${packet.topic}`);
});
