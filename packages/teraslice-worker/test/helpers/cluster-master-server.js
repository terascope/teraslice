'use strict';

const _ = require('lodash');
const MessengerServer = require('../../lib/messenger/server');

class ClusterMasterServer extends MessengerServer {
    constructor(opts = {}) {
        const {
            port,
            actionTimeout,
            networkLatencyBuffer
        } = opts;

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            source: 'cluster_master',
            to: 'execution_controller'
        });

        this.events = opts.events;

        this.clusterAnalytics = {
            slicer: {
                processed: 0,
                failed: 0,
                queued: 0,
                job_duration: 0,
                workers_joined: 0,
                workers_disconnected: 0,
                workers_reconnected: 0
            }
        };

        this._onConnection = this._onConnection.bind(this);
    }

    async start() {
        await this.listen();

        this.server.use((socket, next) => {
            const {
                node_id: nodeId,
            } = socket.handshake.query;

            socket.nodeId = nodeId;
            socket.join(nodeId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    pauseExecution(nodeId, exId, timeoutMs) {
        return this.sendWithResponse({
            address: nodeId,
            message: 'cluster:execution:pause',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    resumeExecution(nodeId, exId, timeoutMs) {
        return this.sendWithResponse({
            address: nodeId,
            message: 'cluster:execution:resume',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    resumerequestAnalyticsExecution(nodeId, exId, timeoutMs) {
        return this.sendWithResponse({
            address: nodeId,
            message: 'cluster:slicer:analytics',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    connectedNodes() {
        return this.server.eio.clientsCount;
    }

    getClusterAnalytics() {
        return _.cloneDeep(this.clusterAnalytics);
    }

    _onConnection(socket) {
        socket.on('error', (err) => {
            this._emit('node:error', err, [socket.nodeId]);
        });

        socket.on('disconnect', (err) => {
            this._emit('node:offline', err, [socket.nodeId]);
        });

        socket.on('cluster:analytics', (msg) => {
            const data = msg.payload;
            if (!this.clusterAnalytics[data.kind]) {
                return;
            }
            _.forOwn(data.stats, (value, field) => {
                if (this.clusterAnalytics[data.kind][field] !== undefined) {
                    this.clusterAnalytics[data.kind][field] += value;
                }
            });
        });

        this.handleResponses(socket);
        this.emit('node:online');
    }
}

module.exports = ClusterMasterServer;
