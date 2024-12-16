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

        // Send a welcome message to the subscribing client
        const welcomeMessage = `Hello ${client.id}, you have subscribed to ${subscriptions[0]?.topic}!`;

        aedes.publish(
            {
                topic: `pulic/mqtt`, // Dedicated welcome topic to avoid loopback
                payload: welcomeMessage,
                qos: 1,                       // At least once delivery
                retain: false,                // Do not retain this message
            },
            client, // Send only to this client
            (err) => {
                if (err) {
                    console.error(`Failed to send welcome message to ${client.id}:`, err);
                } else {
                    console.log(`Welcome message sent to ${client.id} on topic welcome/${client.id}`);
                }
            }
        );
    }
});

// Intercept and process client-published messages
aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`Message received from ${client.id}: ${packet.payload.toString()} on topic ${packet.topic}`);

        
    }
});

// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id}`);
});


