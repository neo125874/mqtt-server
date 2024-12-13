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
    
    // Push a welcome message to the client on a specific topic
    const welcomeTopic = 'welcome/topic';
    const welcomeMessage = `Hello ${client?.id}, welcome to the MQTT broker!`;
    
    aedes.publish({
        topic: welcomeTopic,
        payload: welcomeMessage,
        qos: 0,
    }, () => {
        console.log(`Welcome message sent to ${client?.id}`);
    });
});

// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id}`);
});

// Handle messages published to the broker
aedes.on('publish', (packet, client) => {
    console.log(`Message published: ${packet.payload.toString()} on topic: ${packet.topic}`);
});
