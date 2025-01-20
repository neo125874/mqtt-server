const aedes = require('aedes')(); // Lightweight MQTT broker library
const http = require('http'); // For WebSocket support
const ws = require('websocket-stream'); // WebSocket stream
const colors = require('colors');
const crypto = require('crypto');
const axios = require('axios');

const mqttPort = 1883;  // Port for TCP MQTT
const wsPort = 9001;    // Port for WebSocket MQTT

function generateHMAC(key, message) {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
}

// Function to fetch public IP
async function getPublicIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (error) {
        console.error('Error fetching public IP:', error.message);
        return 'Unknown IP';
    }
}

// Create MQTT server over TCP
const tcpServer = require('net').createServer(aedes.handle);
tcpServer.listen(mqttPort, async () => {
    console.log(`MQTT server is running on tcp://localhost:${mqttPort}`);
    
    // Fetch and log the public IP when the server starts
    try {
        const publicIP = await getPublicIP();
        console.log(`Public IP Address: ${publicIP}`.bgGrey);
    } catch (error) {
        console.error('Error fetching public IP:', error.message);
    }
});

// Create WebSocket server
const httpServer = http.createServer();
ws.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(wsPort, () => {
    console.log(`MQTT server is running on ws://localhost:${wsPort}\n`);
});

//const VALID_HOST_ID = "180321887703093";
const VALID_HOST_IDS = [
    "180321887703093", 
    "191262627700992"

]; // Add more IDs as needed

// Handle incoming client messages on x-topic and send responses to y-topic
aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`Message received from ${client.id.yellow}: ${packet.payload.toString().blue} on topic ${packet.topic.magenta}`);

        // Extract client ID from the topic
        const clientId = client.id;
        const uniqueId = clientId.split('/')[1]

        // Check if the topic is an input topic (mqtt/x/<client.id>)
        if (packet.topic === `mqtt/y/${uniqueId}`) {
            console.log(`Processing message from ${client.id.yellow}...`);

            const payloadMessage = packet.payload.toString();
            let responseMessage = "";

            if (VALID_HOST_IDS.includes(payloadMessage)) {
                // Handle valid host ID
                console.log(`Valid host ID received from ${client.id.yellow}.`.green);
                responseMessage = `Valid host ID received! Proceed Unlock now.`;
            
                const hmacMessage = uniqueId; 
                const hmacKey = payloadMessage; 
                const hmac = generateHMAC(hmacKey, hmacMessage);

                const jsonPayload = JSON.stringify({
                    message: responseMessage, // Original message
                    hmac: hmac               // Generated HMAC
                });

                // Send response to the client
                const responseTopic = `mqtt/x/${uniqueId}`;
                aedes.publish(
                    {
                        topic: responseTopic,
                        payload: jsonPayload,
                        qos: 1,
                        retain: false,
                    },
                    () => {
                        console.log(`Response sent to ${client.id.yellow} on topic mqtt/x/${client.id}`);
                    }
                );
            } else if (payloadMessage.startsWith("unlock:")) {
                // Handle unlock result
                console.log(`Unlock result received from ${clientId.yellow}: ${payloadMessage.bgGrey}`);
            
                if (payloadMessage.includes("SUCCESS")) {
                    console.log(`Client ${clientId.yellow} successfully unlocked.`.green);
                } else if (payloadMessage.includes("FAILURE")) {
                    console.log(`Client ${clientId.yellow} failed to unlock. Details: ${payloadMessage.red}`);
                }else if (payloadMessage.includes("NOT LOCKED")) {
                    console.log(`Client ${clientId.yellow} reported that the drive was not locked.`.cyan);
                } else {
                    console.log(`Unknown unlock result received from ${clientId.yellow}: ${payloadMessage.magenta}`);
                }
            } else {
                // Handle invalid host ID or unexpected payload
                console.log(`Invalid or unexpected message received from ${client.id.yellow}: ${packet.payload.toString().white}`.red);
                responseMessage = `Invalid host ID or unexpected message!`;
            
                const responseTopic = `mqtt/x/${uniqueId}`;
                aedes.publish(
                    {
                        topic: responseTopic,
                        payload: responseMessage,
                        qos: 1,
                        retain: false,
                    },
                    () => {
                        console.log(`Error response sent to ${uniqueId.yellow} on topic ${responseTopic.cyan}`);
                    }
                );
            }
        }
    }
});

// Handle client subscriptions
aedes.on('subscribe', (subscriptions, client) => {
    console.log(`Client ${client.id.yellow} subscribed to: ${subscriptions.map(sub => sub.topic).join(', ').cyan}`);
});

// Handle client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client?.id.yellow}`);
});

