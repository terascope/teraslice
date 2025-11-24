import { cloneDeep, isKey, isNumber } from '@terascope/core-utils';
import type { Socket } from 'socket.io';
import {
    ClientToServerEvents, Message, ResponseError,
    ServerToClientEvents, Server as _Server
} from '../messenger/index.js';
import { ClusterAnalytics, ExecutionAnalyticsMessage, ServerOptions } from './interfaces.js';

export class Server extends _Server {
    private clusterAnalytics: ClusterAnalytics;

    constructor(opts: ServerOptions) {
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
            this.onConnection(
                msg.scope,
                msg.payload as Socket<ClientToServerEvents, ServerToClientEvents>
            );
        });

        await this.listen();
    }

    sendExecutionPause(exId: string): Promise<Message | null> {
        return this.send(exId, 'execution:pause');
    }

    sendExecutionResume(exId: string): Promise<Message | null> {
        return this.send(exId, 'execution:resume');
    }

    sendExecutionAnalyticsRequest(exId: string): Promise<Message | null> {
        return this.send(exId, 'execution:analytics');
    }

    getClusterAnalytics(): ClusterAnalytics {
        return cloneDeep(this.clusterAnalytics);
    }

    onExecutionFinished(fn: (clientId: string, error?: ResponseError) => void): void {
        this.on('execution:finished', (msg) => {
            fn(msg.scope, msg.error);
        });
    }

    private onConnection(exId: string, socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
        this.handleResponse(socket, 'execution:finished', (msg: Message) => {
            this.emit('execution:finished', {
                scope: exId,
                payload: {},
                error: msg.payload.error,
            });
        });

        this.handleResponse(socket, 'cluster:analytics', (msg: Message) => {
            const data = msg.payload as ExecutionAnalyticsMessage;
            if (!(data.kind in this.clusterAnalytics)) {
                return;
            }
            const current = this.clusterAnalytics[data.kind];

            for (const [field, value] of Object.entries(data.stats)) {
                if (isKey(current, field)) {
                    current[field] += value;
                }
            }

            this.emit('cluster:analytics', {
                scope: exId,
                payload: {
                    diff: data.stats,
                    current,
                },
            });

            return {
                recorded: true,
            };
        });
    }
}
