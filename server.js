"use strict";

process.title = "node-ws-server";

var events = require("events");
var WSSocketServer = require("websocket").server;
var http = require("http");

// Configs
var clients = [];
var wsConfig = {
  port: process.env.PORT || 3000
};

function split(str, delimiter) {
  var pos = str.indexOf(delimiter);
  return [str.substr(0, pos), str.substr(pos + 1)];
}

// WS Event Listener
var wsEvents = new events.EventEmitter();

wsEvents.on("__", function(connection) {
  connection.sendUTF("__ pong");
});

wsEvents.on("broadcast", function(c, data) {
  clients.forEach(function(conn) {
    if (conn !== c) {
      conn.sendUTF(`message ${data}`);
    }
  });
});

// HTTP server
var httpServer = http.createServer(function(req, res) {
  console.log("New request");

  res.writeHead(200);
  res.end();
});

httpServer.listen(wsConfig.port, function() {
  console.log("Listening on port: " + wsConfig.port);
});

// WS Server
var wsServer = new WSSocketServer({
  httpServer: httpServer
});

wsServer.on("request", function(request) {
  console.log("New request ws");
  // Accept Connection
  var connection = request.accept(null, request.origin);
  // Push Connection to clients list
  var clientIndex = clients.push(connection) - 1;

  connection.on("message", function(message) {
    if (message.type === "utf8") {
      var parsedMessage = split(message.utf8Data, " ");
      wsEvents.emit(parsedMessage[0], connection, parsedMessage[1]);
    }
  });

  connection.on("close", function() {
    // Remove client from list
    clients.splice(clientIndex, 1);
    // wsEvents.emit("broadcast", null, "Someone left!");
  });
});
