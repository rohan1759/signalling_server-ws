const express = require("express");
const WebSocket = require("ws");
const { WebSocketServer } = require("ws");
require("dotenv").config()

const rooms = {}

const app = express();
const port = process.env.PORT || 8890;

const server = app.listen(port, () => {
    console.log(`HTTP server listening at port ${port}`);
});

const ws = new WebSocketServer({ server });

ws.on("listening", () => {
    console.log(`WebSocket server listening on port ${port}`);
});

ws.on("connection", (connection, req) => {

    let userRoom = null

    console.log(`Client connected from IP: ${req.socket.remoteAddress}`);

    connection.on("message", (message) => {
        try {

            let data = JSON.parse(message)

            if(data.type === "joinRoom"){
                userRoom = data.roomCode

                if(!rooms[userRoom]){   
                    rooms[userRoom] = []
                }else{
                    console.log("room already exist")
                }
                
                if(rooms[userRoom].length < 2){
                    rooms[userRoom].push(connection)
                }else{
                    console.log("room is full")
                }

                console.log("rooms: " + JSON.stringify(rooms[userRoom].length))
            }
            else{
                if(userRoom && rooms[userRoom]){
                    console.log("message emitted")
                    rooms[userRoom].forEach((client) => {
                        if(client !== connection && client.readyState === WebSocket.OPEN){
                            client.send(message)
                        }
                    })
                }
            }

            console.log(`Message : '${(data.type)}'`);
        } catch (err) { 
            console.error(`Error processing message :`, err);
        }
    });

    connection.on("close", () => {

        console.log(`User disconnected`);
        
        if(rooms[userRoom]){
            rooms[userRoom] = rooms[userRoom].filter(client => client !== connection)
        
            rooms[userRoom].forEach((client) => {
                if(client.readyState === WebSocket.OPEN){
                    client.send(JSON.stringify({ "type": "peerLeft"}))        
                }
            })
            if(rooms[userRoom].length === 0){
                delete rooms[userRoom]
            }
        }


    });
    
    // Heartbeat mechanism
    connection.isAlive = true;
    connection.on("pong", () => {
        connection.isAlive = true;
    });

    const interval = setInterval(() => {
        if (!connection.isAlive) {
            console.log(`Terminating stale connection for client`);
            connection.terminate();
            clearInterval(interval);
        } else {
            connection.isAlive = false;
            connection.ping();
        }
    }, 30000); // Ping every 30 seconds
});