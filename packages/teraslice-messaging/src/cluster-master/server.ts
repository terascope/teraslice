import _ from 'lodash';
import * as i from './interfaces';
import * as core from '../messenger';

export class Server extends core.Server {
    private clusterAnalytics: i.ClusterAnalytics;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            actionTimeout,
            networkLatencyBuffer,
            nodeDisconnectTimeout,
        } = opts;

        if (!_.isNumber(nodeDisconnectTimeout)) {
            throw new Error('ClusterMaster.Server requires a valid nodeDisconnectTimeout');
        }

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            pingTimeout: nodeDisconnectTimeout,
            serverName: 'ClusterMaster',
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

    sendExecutionPause(exId: string) {
        return this.send(exId, 'execution:pause');
    }

    sendExecutionResume(exId: string) {
        return this.send(exId, 'execution:resume');
    }

    sendExecutionAnalyticsRequest(exId: string) {
        return this.send(exId, 'execution:analytics');
    }

    getClusterAnalytics() {
        return _.cloneDeep(this.clusterAnalytics);
    }

    onExecutionFinished(fn: core.ClientEventFn) {
        this.on('execution:finished', fn);
    }

    private onConnection(socket: SocketIO.Socket) {
        const exId = this.getClientId(socket);

        socket.on('execution:finished', this.handleResponse(() => {
            this.emit('execution:finished', exId);
        }));

        socket.on('cluster:analytics', this.handleResponse((msg: core.Message) => {
            const data = msg.payload as i.ExecutionAnalyticsMessage;
            if (!this.clusterAnalytics[data.kind]) {
                return;
            }
            _.forOwn(data.stats, (value, field) => {
                if (this.clusterAnalytics[data.kind][field] !== undefined) {
                    this.clusterAnalytics[data.kind][field] += value;
                }
            });
        }));
    }
}
