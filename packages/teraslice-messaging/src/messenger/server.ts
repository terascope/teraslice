'use strict';

import _ from 'lodash';
import SocketIOServer from 'socket.io';
import porty from 'porty';
import * as i from './interfaces';
import { Core } from './core';

export class Server extends Core {
    public port: number;
    public server: SocketIO.Server;

    constructor(opts: i.ServerOptions) {
        const { port } = opts;
        super(opts);

        if (!_.isNumber(port)) {
            throw new Error('Messenger.Server requires a valid port');
        }

        this.port = port;
        this.server = SocketIOServer();
    }

    async listen() {
        const portAvailable = await porty.test(this.port);
        if (!portAvailable) {
            throw new Error(`Port ${this.port} is already in-use`);
        }

        this.server.listen(this.port);
        this.server.on('connection', (socket) => {
            this.handleResponses(socket);
        });
    }

    getClientCounts(): number {
        return _.get(this.server, 'eio.clientsCount', 0);
    }

    async shutdown() {
        await new Promise((resolve) => {
            this.server.close(() => {
                resolve();
            });
        });
        super.close();
    }

    public handleResponses(socket: SocketIO.Socket): void {
        const emitResponse = (msg: i.Message) => {
                /* istanbul ignore if */
            if (!msg.__msgId) {
                console.error('Messaging response requires an a msgId'); // eslint-disable-line
                return;
            }
            this.emit(msg.__msgId, msg);
        };

        socket.on('messaging:response', emitResponse);

        if (this.to === 'cluster_master') {
            socket.on('networkMessage', (msg: i.Message) => {
                if (msg.message === 'messaging:response') {
                    emitResponse(msg);
                    return;
                }
                this.emit(msg.message, msg);
            });
        }
    }
}
