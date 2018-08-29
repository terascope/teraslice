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
        this._onConnection = this._onConnection.bind(this);
    }

    async listen() {
        const portAvailable = await porty.test(this.port);
        if (!portAvailable) {
            throw new Error(`Port ${this.port} is already in-use`);
        }

        this.server.listen(this.port);

        this.server.use((socket, next) => {
            const { clientId } = socket.handshake.query;
            socket.join(clientId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    getClientCounts(): number {
        return _.get(this.server, 'eio.clientsCount', 0);
    }

    onClientOnline(fn: i.ClientEventFn) {
        this.on('client:online', fn);
    }

    onClientReady(fn: i.ClientEventFn) {
        this.on('client:ready', fn);
    }

    onClientOffline(fn: i.ClientEventFn) {
        this.on('client:offline', fn);
    }

    onClientError(fn: i.ClientEventFn) {
        this.on('client:error', fn);
    }

    async shutdown() {
        await new Promise((resolve) => {
            this.server.close(() => {
                resolve();
            });
        });
        super.close();
    }

    emit(eventName: string, clientId: string, param?: any) {
        return super.emit(eventName, clientId, param);
    }

    on(eventName: string, fn: i.ClientEventFn) {
        return super.on(eventName, fn);
    }

    protected getClientId(socket: SocketIO.Socket):string {
        return socket.handshake.query.clientId;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const clientId = this.getClientId(socket);
        console.log({ clientId })

        socket.on('error', (err: Error) => {
            this.emit('client:error', clientId, err);
        });

        socket.on('disconnect', (err: Error) => {
            this.emit('client:offline', clientId, err);
        });

        socket.on('client:ready', () => {
            this.emit('client:ready', clientId);
        });

        socket.on('messaging:response', (msg: i.Message) => {
            this.emit(msg.__msgId, clientId, msg)
        });

        this.emit('client:online', clientId)
    }
}
