'use strict';

import _ from 'lodash';
import SocketIOServer from 'socket.io';
import porty from 'porty';
import { newMsgId } from '../utils';
import * as i from './interfaces';
import { Core } from './core';

export class Server extends Core {
    readonly port: number;
    readonly server: SocketIO.Server;
    readonly serverName: string;
    protected _clients: i.ConnectedClient[];

    constructor(opts: i.ServerOptions) {
        const { port, pingTimeout, serverName } = opts;
        super(opts);

        if (!_.isNumber(port)) {
            throw new Error('Messenger.Server requires a valid port');
        }

        if (!_.isNumber(pingTimeout)) {
            throw new Error('Messenger.Server requires a valid pingTimeout');
        }

        if (!_.isString(serverName)) {
            throw new Error('Messenger.Server requires a valid serverName');
        }

        this.port = port;
        this.serverName = serverName;
        this._clients = [];

        this.server = SocketIOServer({
            pingTimeout,
        });

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

    getClient(clientId: string): i.ConnectedClient|undefined {
        return _.clone(_.find(this._clients, { clientId }));
    }

    get onlineClients(): i.ConnectedClient[] {
        return _.clone(_.filter(this._clients, { isOnline: true }));
    }

    get onlineClientCount(): number {
        return _.size(_.filter(this._clients, { isOnline: true }));
    }

    get offlineClients(): i.ConnectedClient[] {
        return _.clone(_.filter(this._clients, { isOnline: false }));
    }

    get offlineClientCount(): number {
        return _.size(_.filter(this._clients, { isOnline: false }));
    }

    get availableClients(): i.ConnectedClient[] {
        return _.clone(_.filter(this._clients, { isAvailable: true }));
    }

    get availableClientCount(): number {
        return _.size(_.filter(this._clients, { isAvailable: true }));
    }

    get unavailableClients(): i.ConnectedClient[] {
        return _.clone(_.filter(this._clients, { isAvailable: false }));
    }

    get unavailableClientCount(): number {
        return _.size(_.filter(this._clients, { isAvailable: false }));
    }

    onClientOnline(fn: i.ClientEventFn) {
        this.on('client:online', fn);
    }

    onClientAvailable(fn: i.ClientEventFn) {
        this.on('client:available', fn);
    }

    onClientUnavailable(fn: i.ClientEventFn) {
        this.on('client:unavailable', fn);
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

    protected broadcast(eventName: string, payload: i.Payload) {
        const message: i.Message = {
            id: newMsgId(),
            eventName,
            payload,
            to: '*',
            from: this.serverName,
        };

        this.server.sockets.emit(eventName, message);
    }

    protected async send(clientId: string, eventName: string, payload: i.Payload = {}): Promise<i.Message> {
        const client = this.getClient(clientId);
        if (!client) {
            throw new Error(`No client found by that id "${clientId}"`);
        }

        const message: i.Message = {
            id: newMsgId(),
            eventName,
            payload,
            to: clientId,
            from: this.serverName,
        };

        const socket = _.get(this.server, ['sockets', 'sockets', client.socketId]);
        if (!socket) {
            throw new Error(`Unable to find socket by socket id ${client.socketId}`);
        }

        const response = await new Promise((resolve, reject) => {
            socket.emit(eventName, message, this.handleSendResponse(resolve, reject));
        });

        return response as i.Message;
    }

    protected getClientId(socket: SocketIO.Socket):string {
        return socket.handshake.query.clientId;
    }

    protected ensureClient(socket: SocketIO.Socket) : i.ConnectedClient {
        const clientId = this.getClientId(socket);
        const client = this.getClient(clientId);

        if (client) return client;

        const newClient: i.ConnectedClient = {
            clientId,
            isOnline: true,
            isAvailable: false,
            onlineAt: new Date(),
            offlineAt: null,
            unavailableAt: null,
            availableAt: null,
            socketId: socket.id,
            metadata: {},
        };

        this._clients.push(newClient);
        return newClient;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const client = this.ensureClient(socket);

        socket.on('error', (err: Error) => {
            this.emit('client:error', client.clientId, err);
        });

        socket.on('disconnect', (err: Error) => {
            client.isOnline = false;
            client.isAvailable = false;
            client.unavailableAt = null;
            client.availableAt = null;
            this.emit('client:offline', client.clientId, err);
        });

        socket.on('client:available', this.handleResponse(() => {
            client.isAvailable = true;
            client.availableAt = new Date();
            client.unavailableAt = new Date();
            this.emit('client:available', client.clientId);
        }));

        socket.on('client:unavailable', this.handleResponse(() => {
            client.isAvailable = false;
            client.unavailableAt = new Date();
            client.availableAt = null;
            this.emit('client:unavailable', client.clientId);
        }));

        this.emit('client:online', client.clientId);
    }
}
