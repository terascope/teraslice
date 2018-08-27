'use strict';

import _ from 'lodash';
import Server from 'socket.io';
import porty from 'porty';
import * as m from './interfaces';
import { MessengerCore, MessengerCoreOptions } from './core';

export interface MessengerServerOptions extends MessengerCoreOptions {
    port: number;
}

export class MessengerServer extends MessengerCore {
    public port: number;
    public server: SocketIO.Server;

    constructor(opts: MessengerServerOptions) {
        const { port } = opts;
        super(opts);

        if (!_.isNumber(port)) {
            throw new Error('MessengerServer requires a valid port');
        }

        this.port = port;
        this.server = Server();
    }

    async listen() {
        const portAvailable = await porty.test(this.port);
        if (!portAvailable) {
            throw new Error(`Port ${this.port} is already in-use`);
        }

        this.server.listen(this.port);
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
        const emitResponse = (msg: m.Message) => {
                /* istanbul ignore if */
            if (!msg.__msgId) {
                console.error('Messaging response requires an a msgId'); // eslint-disable-line
                return;
            }
            this.emit(msg.__msgId, msg);
        };

        socket.on('messaging:response', emitResponse);

        if (this.to === 'cluster_master') {
            socket.on('networkMessage', (msg: m.Message) => {
                if (msg.message === 'messaging:response') {
                    emitResponse(msg);
                    return;
                }
                this.emit(msg.message, msg);
            });
        }
    }
}
