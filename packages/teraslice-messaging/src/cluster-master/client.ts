import { isString } from '@terascope/utils';
import * as i from './interfaces';
import * as core from '../messenger';

export class Client extends core.Client {
    public readonly exId: string;

    constructor(opts: i.ClientOptions) {
        const { clusterMasterUrl, socketOptions, networkLatencyBuffer, actionTimeout, exId, connectTimeout, logger } = opts;

        if (!clusterMasterUrl || !isString(clusterMasterUrl)) {
            throw new Error('ClusterMaster.Client requires a valid clusterMasterUrl');
        }

        if (!exId || !isString(exId)) {
            throw new Error('ClusterMaster.Client requires a valid exId');
        }

        super({
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            connectTimeout,
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

    sendClusterAnalytics(stats: i.ClusterExecutionAnalytics, timeout?: number) {
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
