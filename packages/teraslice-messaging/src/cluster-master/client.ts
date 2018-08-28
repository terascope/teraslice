import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Client extends core.Client {
    public controllerId: string;

    constructor(opts: i.ClientOptions) {
        const {
            clusterMasterUrl,
            socketOptions: _socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            controllerId,
        } = opts;

        if (!clusterMasterUrl || !_.isString(clusterMasterUrl)) {
            throw new Error('ClusterMaster.Client requires a valid clusterMasterUrl');
        }

        if (!controllerId || !_.isString(controllerId)) {
            throw new Error('ClusterMaster.Client requires a valid controllerId');
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

    updateAnalytics(stats: i.SlicerAnalytics) {
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
