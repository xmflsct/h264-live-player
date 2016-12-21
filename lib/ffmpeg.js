"use strict";

const spawn = require('child_process').spawn;
const merge = require('mout/object/merge');
const Server = require('./_server');

class FFMpegServer extends Server {
    constructor(server, opts) {
        super(server, merge({
            fps: 30,
        }, opts));
    }

    get_feed() {
        var args = [
                "-rtsp_transport", "tcp",
                "-i", "rtsp://roundandround.ddns.net:2455/ch0_0.h264",
                '-c:v', 'libx264',
                '-vprofile', 'baseline',
                '-f', 'rawvideo',
                '-'
            ]
            // console.log("ffmpeg " + args.join(' '));
        var streamer = spawn('ffmpeg', args);
        this.streamer = streamer;
        // streamer.stderr.pipe(process.stderr);

        streamer.on("exit", function(code) {
            if (code == 255) {
                console.log('[STREAM] FFmpeg stopped.');
            } else {
                console.log("Failure", code);
            }
        });

        return streamer.stdout;
    }

    kill_feed() {
        var self = this;
        self.streamer.kill('SIGINT');
    }
};

module.exports = FFMpegServer;
