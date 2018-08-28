import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Client extends core.Client {
    public readonly controllerId: string;
    public readonly exId: string;
    public readonly jobId: string;
    public readonly jobName: string;

    constructor(opts: i.ClientOptions) {
        const {
            clusterMasterUrl,
            socketOptions: _socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            controllerId,
            exId,
            jobId,
            jobName,
        } = opts;

        if (!clusterMasterUrl || !_.isString(clusterMasterUrl)) {
            throw new Error('ClusterMaster.Client requires a valid clusterMasterUrl');
        }

        if (!controllerId || !_.isString(controllerId)) {
            throw new Error('ClusterMaster.Client requires a valid controllerId');
        }

        if (!exId || !_.isString(exId)) {
            throw new Error('ClusterMaster.Client requires a valid exId');
        }

        if (!jobId || !_.isString(jobId)) {
            throw new Error('ClusterMaster.Client requires a valid jobId');
        }

        if (!jobName || !_.isString(jobName)) {
            throw new Error('ClusterMaster.Client requires a valid jobName');
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
        this.exId = exId;
        this.jobId = jobId;
        this.jobName = jobName;
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

    executionTerminal() {
        return this.send({
            message: 'execution:error:terminal',
            ex_id: this.exId
        });
    }

    executionFinished() {
        return this.send({
            message: 'execution:finished',
            ex_id: this.exId
        });
    }

    onClusterAnalytics(fn: i.OnClusterAnalyticsFn) {
        this.socket.on('cluster:slicer:analytics', async (msg: core.Message) => {
            const stats = await fn();
            this.respond(msg, {
                job_id: this.jobId,
                ex_id: this.exId,
                payload: {
                    name: this.jobName,
                    stats,
                }
            })
        })
    }

    onStopExecution(fn: i.OnStateChangeFn) {
        this.socket.on('cluster:execution:stop', async (msg: core.Message) => {
            await fn();
            this.respond(msg)
        })
    }

    onPauseExecution(fn: i.OnStateChangeFn) {
        this.socket.on('cluster:execution:pause', async (msg: core.Message) => {
            await fn();
            this.respond(msg)
        })
    }

    onResumeExecution(fn: i.OnStateChangeFn) {
        this.socket.on('cluster:execution:resume', async (msg: core.Message) => {
            await fn();
            this.respond(msg)
        })
    }
}
