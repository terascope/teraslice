import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Client extends core.Client {
    public readonly exId: string;

    constructor(opts: i.ClientOptions) {
        const {
            clusterMasterUrl,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            exId,
            connectTimeout
        } = opts;

        if (!clusterMasterUrl || !_.isString(clusterMasterUrl)) {
            throw new Error('ClusterMaster.Client requires a valid clusterMasterUrl');
        }

        if (!exId || !_.isString(exId)) {
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
        });

        this.exId = exId;
    }

    async start() {
        try {
            await this.connect();
        } catch (err) {
            throw new Error(`Unable to connect to cluster master, caused by error: ${err.message}`);
        }
    }

    sendClusterAnalytics(stats: i.ClusterExecutionAnalytics) {
        return this.send('cluster:analytics', {
            stats,
            kind: 'slicer'
        }, {
            volatile: true,
            response: true,
        });
    }

    sendExecutionFinished(error?: string) {
        return this.send('execution:finished', { error }, {
            volatile: true,
        });
    }

    onExecutionAnalytics(fn: core.MessageHandler) {
        this.socket.on('execution:analytics', this.handleResponse('execution:analytics', fn));
    }

    onExecutionPause(fn: core.MessageHandler) {
        this.socket.on('execution:pause', this.handleResponse('execution:pause', fn));
    }

    onExecutionResume(fn: core.MessageHandler) {
        this.socket.on('execution:resume', this.handleResponse('execution:resume', fn));
    }
}
