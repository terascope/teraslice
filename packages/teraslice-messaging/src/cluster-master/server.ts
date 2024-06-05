import { isNumber, cloneDeep } from '@terascope/utils';
import * as i from './interfaces.js';
import * as core from '../messenger/index.js';

export class Server extends core.Server {
    private clusterAnalytics: i.ClusterAnalytics;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            actionTimeout,
            networkLatencyBuffer,
            nodeDisconnectTimeout,
            requestListener,
            serverTimeout,
            logger,
        } = opts;

        if (!isNumber(nodeDisconnectTimeout)) {
            throw new Error('ClusterMaster.Server requires a valid nodeDisconnectTimeout');
        }

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            clientDisconnectTimeout: nodeDisconnectTimeout,
            requestListener,
            serverTimeout,
            serverName: 'ClusterMaster',
            logger,
        });

        this.clusterAnalytics = {
            controllers: {
                processed: 0,
                failed: 0,
                queued: 0,
                job_duration: 0,
                workers_joined: 0,
                workers_disconnected: 0,
                workers_reconnected: 0,
            },
        };
    }

    async start(): Promise<void> {
        this.on('connection', (msg) => {
            this.onConnection(msg.scope, msg.payload as SocketIO.Socket);
        });

        await this.listen();
    }

    sendExecutionPause(exId: string): Promise<core.Message|null> {
        return this.send(exId, 'execution:pause');
    }

    sendExecutionResume(exId: string): Promise<core.Message|null> {
        return this.send(exId, 'execution:resume');
    }

    sendExecutionAnalyticsRequest(exId: string): Promise<core.Message|null> {
        return this.send(exId, 'execution:analytics');
    }

    getClusterAnalytics(): i.ClusterAnalytics {
        return cloneDeep(this.clusterAnalytics);
    }

    onExecutionFinished(fn: (clientId: string, error?: core.ResponseError) => void): void {
        this.on('execution:finished', (msg) => {
            fn(msg.scope, msg.error);
        });
    }

    onExecutionError(fn: (clientId: string, error?: core.ResponseError) => void): void {
        this.on('execution:error', (msg) => {
            fn(msg.scope, msg.error);
        });
    }

    private onConnection(exId: string, socket: SocketIO.Socket) {
        this.handleResponse(socket, 'execution:finished', (msg: core.Message) => {
            this.emit('execution:finished', {
                scope: exId,
                payload: {},
                error: msg.payload.error,
            });
        });

        this.handleResponse(socket, 'execution:error', (msg: core.Message) => {
            this.emit('execution:error', {
                scope: exId,
                payload: {},
                error: msg.payload.error,
            });
        });


        this.handleResponse(socket, 'cluster:analytics', (msg: core.Message) => {
            const data = msg.payload as i.ExecutionAnalyticsMessage;
            if (!this.clusterAnalytics[data.kind]) {
                return;
            }

            for (const [field, value] of Object.entries(data.stats)) {
                if (this.clusterAnalytics[data.kind][field] != null) {
                    this.clusterAnalytics[data.kind][field] += value;
                }
            }

            this.emit('cluster:analytics', {
                scope: exId,
                payload: {
                    diff: data.stats,
                    current: this.clusterAnalytics[data.kind],
                },
            });

            return {
                recorded: true,
            };
        });
    }
}
