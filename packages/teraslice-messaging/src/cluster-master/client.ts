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
            hostUrl: clusterMasterUrl,
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
            kind: 'slicer',
        });
    }

    sendExecutionFinished(error?: Error|string) {
        return this.send('execution:finished', { error });
    }

    onExecutionAnalytics(fn: core.MessageHandler) {
        this.socket.on('execution:analytics', this.handleResponse(fn));
    }

    onExecutionPause(fn: core.MessageHandler) {
        this.socket.on('execution:pause', this.handleResponse(fn));
    }

    onExecutionResume(fn: core.MessageHandler) {
        this.socket.on('execution:resume', this.handleResponse(fn));
    }
}
