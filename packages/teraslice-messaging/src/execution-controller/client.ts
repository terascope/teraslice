import { Slice } from '@terascope/teraslice-types';
import isString from 'lodash/isString';
import pickBy from 'lodash/pickBy';
import * as core from '../messenger';
import * as i from './interfaces'

export class Client extends core.Client {
    public workerId: string;
    public available: boolean;

    constructor(opts: i.ClientOptions) {
        const {
            executionControllerUrl,
            socketOptions: _socketOptions,
            workerId,
            networkLatencyBuffer,
            actionTimeout,
        } = opts;

        if (!isString(executionControllerUrl)) {
            throw new Error('ExecutionController.Client requires a valid executionControllerUrl');
        }

        if (!isString(workerId)) {
            throw new Error('ExecutionController.Client requires a valid workerId');
        }

        const socketOptions = Object.assign({
            autoConnect: false,
            query: {
                worker_id: workerId,
            }
        }, _socketOptions);

        super({
            hostUrl: executionControllerUrl,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            source: workerId,
            to: 'execution_controller'
        });

        this.workerId = workerId;
        this.available = false;
    }

    async start() {
        try {
            await this.connect();
        } catch (err) {
            throw new Error(`Unable to connect to execution controller, caused by error: ${err.message}`);
        }

        this.socket.on('slicer:slice:new', (msg: core.Message) => {
            this.respond(msg, {
                payload: {
                    willProcess: this.available
                },
            });
            if (this.available) {
                this.emit('slicer:slice:new', msg.payload);
            }
        });

        this.socket.on('execution:finished', (msg: core.Message) => {
            this.emit('worker:shutdown', msg);
        });
    }

    async ready() {
        return this.send({
            message: 'worker:ready',
            payload: {
                worker_id: this.workerId
            }
        });
    }

    onWorkerShutdown(fn: i.WorkerShutdownFn) {
        this.once('worker:shutdown', fn);
    }

    sliceComplete(input: i.SliceCompletePayload) {
        const payload = pickBy(Object.assign({
            worker_id: this.workerId
        }, input));

        return this.sendWithResponse({
            message: 'worker:slice:complete',
            payload
        }, { retry: true });
    }

    async waitForSlice(fn = () => { }, interval = 100): Promise<Slice|undefined> {
        this.ready();
        this.available = true;

        const slice = await new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (this.closed || fn()) {
                    this.removeListener('slicer:slice:new', onMessage);
                    resolve();
                }
            }, interval);
            const onMessage = (msg: Slice) => {
                clearInterval(intervalId);
                resolve(msg);
                this.available = false;
            }
            this.once('slicer:slice:new', onMessage);
        });

        this.available = false;

        if (!slice) return;

        return slice as Slice;
    }
}
