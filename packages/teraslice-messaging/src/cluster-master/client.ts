import { isString, isNumber } from '@terascope/core-utils';
import { AggregatedExecutionAnalytics } from '@terascope/types';
import * as i from './interfaces.js';
import * as core from '../messenger/index.js';

export class Client extends core.Client {
    public readonly exId: string;

    constructor(opts: i.ClientOptions) {
        const {
            clusterMasterUrl,
            socketOptions,
            nodeDisconnectTimeout,
            networkLatencyBuffer,
            actionTimeout,
            exId,
            connectTimeout,
            logger
        } = opts;

        if (!clusterMasterUrl || !isString(clusterMasterUrl)) {
            throw new Error('ClusterMaster.Client requires a valid clusterMasterUrl');
        }

        if (!exId || !isString(exId)) {
            throw new Error('ClusterMaster.Client requires a valid exId');
        }

        if (!isNumber(nodeDisconnectTimeout)) {
            throw new Error('ClusterMaster.Client requires a valid nodeDisconnectTimeout');
        }

        super({
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            connectTimeout,
            clientDisconnectTimeout: nodeDisconnectTimeout,
            hostUrl: clusterMasterUrl,
            clientType: 'execution-controller',
            clientId: exId,
            serverName: 'ClusterMaster',
            logger,
        });

        this.exId = exId;
    }

    async start() {
        await this.connect();
    }

    sendClusterAnalytics(stats: AggregatedExecutionAnalytics, timeout?: number) {
        return this.send(
            'cluster:analytics',
            {
                stats,
                kind: 'controllers',
            },
            {
                volatile: true,
                response: true,
                timeout,
            }
        );
    }

    sendExecutionFinished(error?: string) {
        if (!this.isClientReady()) return;

        return this.send(
            'execution:finished',
            { error },
            {
                volatile: true,
            }
        );
    }

    onExecutionAnalytics(fn: core.MessageHandler) {
        this.handleResponse(this.socket, 'execution:analytics', fn);
    }

    onExecutionPause(fn: core.MessageHandler) {
        this.handleResponse(this.socket, 'execution:pause', fn);
    }

    onExecutionResume(fn: core.MessageHandler) {
        this.handleResponse(this.socket, 'execution:resume', fn);
    }
}
