import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Client extends core.Client {
    public readonly exId: string;
    public readonly jobId: string;
    public readonly jobName: string;

    constructor(opts: i.ClientOptions) {
        const {
            clusterMasterUrl,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            exId,
            jobId,
            jobName,
        } = opts;

        if (!clusterMasterUrl || !_.isString(clusterMasterUrl)) {
            throw new Error('ClusterMaster.Client requires a valid clusterMasterUrl');
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

        super({
            hostUrl: clusterMasterUrl,
            clientId: exId,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            to: 'cluster_master',
            source: exId
        });

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

        await this.ready();
    }

    sendExecutionAnalyticsDiffs(stats: i.SlicerAnalytics) {
        return this.send({
            message: 'execution:analytics',
            payload: {
                kind: 'slicer',
                stats,
            }
        });
    }

    sendExecutionFinished(error?: Error|string) {
        const msg: core.InputMessage = {
            message: 'execution:finished',
        }

        if (error) {
            msg.error = _.isString(error) ? error : error.stack;
        }

        return this.send(msg);
    }

    onExecutionAnalytics(fn: i.OnExecutionAnalyticsFn) {
        this.socket.on('execution:analytics', async (msg: core.Message) => {
            const stats = await fn();
            this.respond(msg, {
                job_id: this.jobId,
                exId: this.exId,
                payload: {
                    name: this.jobName,
                    stats,
                }
            })
        })
    }

    onExecutionPause(fn: i.OnStateChangeFn) {
        this.socket.on('execution:pause', async (msg: core.Message) => {
            await fn();
            this.respond(msg)
        })
    }

    onExecutionResume(fn: i.OnStateChangeFn) {
        this.socket.on('execution:resume', async (msg: core.Message) => {
            await fn();
            this.respond(msg)
        })
    }
}
