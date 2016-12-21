"use strict";

const WebSocketServer = require('ws').Server;
const Splitter = require('stream-split');
const merge = require('mout/object/merge');

const NALseparator = new Buffer([0, 0, 0, 1]); //NAL break
var clientsCount = 0;

class _Server {
    constructor(server, options) {
        this.options = merge({
            width: 1280,
            height: 720,
        }, options);

        this.wss = new WebSocketServer({
            server
        });

        this.new_client = this.new_client.bind(this);
        this.start_feed = this.start_feed.bind(this);
        this.broadcast = this.broadcast.bind(this);

        this.wss.on('connection', this.new_client);
    }

    start_feed() {
        var readStream = this.get_feed();
        this.readStream = readStream;

        readStream = readStream.pipe(new Splitter(NALseparator));
        readStream.on("data", this.broadcast);
    }

    get_feed() {
        throw new Error("to be implemented");
    }

    stop_feed() {
        this.kill_feed();
    }

    broadcast(data) {
        this.wss.clients.forEach(function(socket) {

            if (socket.buzy)
                return;

            socket.buzy = true;
            socket.buzy = false;

            socket.send(Buffer.concat([NALseparator, data]), {
                binary: true
            }, function ack(error) {
                socket.buzy = false;
            });
        });
    }

    new_client(socket) {
        if (clientsCount == 0) {
            var self = this;
            self.start_feed();
            console.log('[STREAM] starting FFmpeg.');
        }
        clientsCount += 1;
        console.log('[CLIENT] ' + clientsCount + ' clients connected.');

        socket.send(JSON.stringify({
            action: "init",
            width: this.options.width,
            height: this.options.height,
        }));

        socket.on('close', function() {
            clientsCount -= 1;
            console.log('[CLIENT] ' + clientsCount + ' clients connected.');
            if (clientsCount <= 0) {
                self.stop_feed();
                console.log('[STREAM] trying to stop FFmpeg.');
                clientsCount = 0;
            }
        });
    }
};

module.exports = _Server;
