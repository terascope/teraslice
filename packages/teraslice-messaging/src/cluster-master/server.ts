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

        this._onConnection = this._onConnection.bind(this);
    }

    async start() {
        await this.listen();

        this.server.use((socket, next) => {
            const {
                controller_id: controllerId
            } = socket.handshake.query;

            // @ts-ignore
            socket.controllerId = controllerId;
            socket.join(controllerId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    stopExecution(controllerId: string, exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: controllerId,
            message: 'cluster:execution:stop',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    pauseExecution(controllerId: string, exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: controllerId,
            message: 'cluster:execution:pause',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    resumeExecution(controllerId: string, exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: controllerId,
            message: 'cluster:execution:resume',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    requestAnalytics(controllerId: string, exId: string, timeoutMs?: number) {
        return this.sendWithResponse({
            address: controllerId,
            message: 'cluster:slicer:analytics',
            payload: {
                ex_id: exId
            }
        }, { timeoutMs });
    }

    connectedNodes() {
        return this.getClientCounts();
    }

    getClusterAnalytics() {
        return _.cloneDeep(this.clusterAnalytics);
    }

    _onConnection(socket: SocketIO.Socket) {
        // @ts-ignore
        const { controllerId } = socket;

        socket.on('error', (err: Error) => {
            this.emit('controller:error', err, [controllerId]);
        });

        socket.on('disconnect', (err: Error) => {
            this.emit('controller:offline', err, [controllerId]);
        });

        socket.on('cluster:analytics', (msg: core.Message) => {
            const data = msg.payload as i.ClusterAnalyticsMessage;
            if (!this.clusterAnalytics[data.kind]) {
                return;
            }
            _.forOwn(data.stats, (value, field) => {
                if (this.clusterAnalytics[data.kind][field] !== undefined) {
                    this.clusterAnalytics[data.kind][field] += value;
                }
            });
        });

        this.emit('controller:online');
    }
}
