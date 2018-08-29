import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Server extends core.Server {
    private clusterAnalytics: i.ClusterAnalytics;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            actionTimeout,
            networkLatencyBuffer
        } = opts;

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            source: 'cluster_master',
            to: 'execution_controller'
        });

        this.clusterAnalytics = {
            slicer: {
                processed: 0,
                failed: 0,
                queued: 0,
                job_duration: 0,
                workers_joined: 0,
                workers_disconnected: 0,
                workers_reconnected: 0
            }
        };

        this.onConnection = this.onConnection.bind(this);
    }

    async start() {
        await this.listen();

        this.server.on('connection', this.onConnection);
    }

    sendPauseExecution(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:pause',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    sendResumeExecution(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:resume',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    sendRequestAnalytics(exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: exId,
            message: 'execution:analytics',
            payload: {
                exId: exId
            }
        }, { timeoutMs });
    }

    connectedExecutions() {
        return this.getClientCounts();
    }

    getClusterAnalytics() {
        return _.cloneDeep(this.clusterAnalytics);
    }

    onExecutionFinished(fn: core.ClientEventFn) {
        this.on('execution:finished', fn);
    }

    private onConnection(socket: SocketIO.Socket) {
        const exId = this.getClientId(socket);

        socket.on('execution:finished', () => {
            this.emit('execution:finished', exId)
        })

        socket.on('execution:analytics', (msg: core.Message) => {
            const data = msg.payload as i.ExecutionAnalyticsMessage;
            if (!this.clusterAnalytics[data.kind]) {
                return;
            }
            _.forOwn(data.stats, (value, field) => {
                if (this.clusterAnalytics[data.kind][field] !== undefined) {
                    this.clusterAnalytics[data.kind][field] += value;
                }
            });
        });
    }
}
