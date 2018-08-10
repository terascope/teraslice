'use strict';

const _ = require('lodash');
const Server = require('socket.io');
const porty = require('porty');
const MessengerCore = require('./core');

class MessengerServer extends MessengerCore {
    constructor(opts) {
        const {
            port,
        } = opts;

        super(opts, 'server');

        if (!_.isNumber(port)) {
            throw new Error('MessengerServer requires a valid port');
        }

        this.port = port;
        this.server = new Server();
    }

    async listen() {
        const portAvailable = await porty.test(this.port);
        if (!portAvailable) {
            throw new Error(`Port ${this.port} is already in-use`);
        }

        this.server.listen(this.port);
    }

    async shutdown() {
        await new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err && err.toString() === 'Error: Not running') {
                    resolve();
                    return;
                }
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        super.close();
    }
}

module.exports = MessengerServer;
