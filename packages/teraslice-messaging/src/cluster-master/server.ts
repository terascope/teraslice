import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Server extends core.Server {
    private clusterAnalytics: i.ClusterAnalytics;

    constructor(opts: i.ServerOptions) {
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
            const { exId } = socket.handshake.query;

            // @ts-ignore
            socket.exId = exId;
            socket.join(exId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    stopExecution(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:stop',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    pauseExecution(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:pause',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    resumeExecution(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:resume',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    requestAnalytics(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:analytics',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    connectedExecutions() {
        return this.getClientCounts();
    }

    getClusterAnalytics() {
        return _.cloneDeep(this.clusterAnalytics);
    }

    onExecutionOffline(fn: i.ExecutionErrorEventFn) {
        this.on('execution:offline', fn);
    }

    onExecutionOnline(fn: i.ExecutionEventFn) {
        this.on('execution:online', fn);
    }

    onExecutionReady(fn: i.ExecutionEventFn) {
        this.on('execution:ready', fn);
    }

    onExecutionError(fn: i.ExecutionErrorEventFn) {
        this.on('execution:error', fn);
    }

    _onConnection(socket: SocketIO.Socket) {
        // @ts-ignore
        const { exId } = socket;

        socket.on('error', (err: Error) => {
            this.emit('execution:error', exId, err);
        });

        socket.on('disconnect', (err: Error) => {
            this.emit('execution:offline', exId, err);
        });

        socket.on('execution:ready', () => {
            this.emit('execution:ready', exId);
        });

        socket.on('execution:analytics', (msg: core.Message) => {
            const data = msg.payload as i.ExecutionAnalyticsMessage;
            if (!this.clusterAnalytics[data.kind]) {
                return;
            }
            _.forOwn(data.stats, (value, field) => {
                if (this.clusterAnalytics[data.kind][field] !== undefined) {
                    this.clusterAnalytics[data.kind][field] += value;
                }
            });
        });

        this.emit('execution:online', exId);
    }
}
