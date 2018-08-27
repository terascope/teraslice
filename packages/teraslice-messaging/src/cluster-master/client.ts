import _ from 'lodash';
import { SlicerAnalytics } from './interfaces';
import { MessengerClient } from '../messenger/client';

export interface ClusterMasterClientOptions {
    clusterMasterUrl: string;
    controllerId: string;
    socketOptions: SocketIOClient.ConnectOpts;
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export class ClusterMasterClient extends MessengerClient {
    public controllerId: string;

    constructor(opts: ClusterMasterClientOptions) {
        const {
            clusterMasterUrl,
            socketOptions: _socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            controllerId,
        } = opts;

        if (!clusterMasterUrl || !_.isString(clusterMasterUrl)) {
            throw new Error('ClusterMasterClient requires a valid clusterMasterUrl');
        }

        if (!controllerId || !_.isString(controllerId)) {
            throw new Error('ClusterMasterClient requires a valid controllerId');
        }

        const socketOptions = Object.assign({
            autoConnect: false,
            query: {
                controller_id: controllerId,
            }
        }, _socketOptions);

        super({
            hostUrl: clusterMasterUrl,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            to: 'cluster_master',
            source: controllerId
        });

        this.controllerId = controllerId;
    }

    async start() {
        try {
            await this.connect();
        } catch (err) {
            throw new Error(`Unable to connect to cluster master, caused by error: ${err.message}`);
        }

        await this.send({
            message: 'execution:online',
            controller_id: this.controllerId,
            payload: {},
        });

        this.handleResponses(this.socket);
    }

    updateAnalytics(stats: SlicerAnalytics) {
        return this.send({
            message: 'cluster:analytics',
            payload: {
                kind: 'slicer',
                stats,
            }
        });
    }

    executionTerminal(exId: string) {
        return this.send({
            message: 'execution:error:terminal',
            ex_id: exId
        });
    }

    executionFinished(exId: string) {
        return this.send({
            message: 'execution:finished',
            ex_id: exId
        });
    }
}

module.exports = ClusterMasterClient;
