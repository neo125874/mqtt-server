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

// Handle incoming client messages on x-topic and send responses to y-topic
aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`Message received from ${client.id}: ${packet.payload.toString()} on topic ${packet.topic}`);

        // Extract client ID from the topic
        const clientId = client.id;
        const uniqueId = clientId.split('/')[1]

        // Check if the topic is an input topic (mqtt/x/<client.id>)
        if (packet.topic === `mqtt/y/${uniqueId}`) {
            console.log(`Processing message from ${clientId}...`);

            // Send response to the client's y-topic
            const responseTopic = `mqtt/x/${uniqueId}`;
            const responseMessage = `Hello ${uniqueId}, your message was received: ${packet.payload.toString()}`;

            aedes.publish({
                topic: responseTopic,
                payload: responseMessage,
                qos: 1,
                retain: false
            }, () => {
                console.log(`Response sent to ${uniqueId} on topic ${responseTopic}`);
            });
        }
    }
});

// Handle client subscriptions
aedes.on('subscribe', (subscriptions, client) => {
    console.log(`Client ${client.id} subscribed to: ${subscriptions.map(sub => sub.topic).join(', ')}`);
});

// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id}`);
});

