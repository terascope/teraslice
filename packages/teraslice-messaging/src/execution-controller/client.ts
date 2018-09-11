import { Slice } from '@terascope/teraslice-types';
import { isString, pickBy } from 'lodash';
import * as core from '../messenger';
import * as i from './interfaces';

export class Client extends core.Client {
    public workerId: string;

    constructor(opts: i.ClientOptions) {
        const {
            executionControllerUrl,
            socketOptions,
            workerId,
            networkLatencyBuffer,
            actionTimeout,
            connectTimeout,
        } = opts;

        if (!isString(executionControllerUrl)) {
            throw new Error('ExecutionController.Client requires a valid executionControllerUrl');
        }

        if (!isString(workerId)) {
            throw new Error('ExecutionController.Client requires a valid workerId');
        }

        super({
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            connectTimeout,
            hostUrl: executionControllerUrl,
            clientId: workerId,
            clientType: 'worker',
            serverName: 'ExecutionController'
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

        this.socket.on('execution:slice:new', this.handleResponse('execution:slice:new', (msg: core.Message) => {
            const willProcess = this.available;
            if (willProcess) {
                this.emit('execution:slice:new', msg.payload);
            }

            return {
                willProcess,
            };
        }));

        this.socket.on('execution:finished', this.handleResponse('execution:finished', (msg: core.Message) => {
            this.emit('execution:finished', msg.payload);
        }));
    }

    onExecutionFinished(fn: core.ClientEventFn) {
        this.once('execution:finished', fn);
    }

    sendSliceComplete(payload: i.SliceCompletePayload) {
        return this.send('worker:slice:complete', pickBy(payload), {
            response: true,
            volatile: false,
        });
    }

    async waitForSlice(fn: i.WaitUntilFn = () => false, interval = 100): Promise<Slice|undefined> {
        this.sendAvailable();

        const slice = await new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (!this.ready || fn()) {
                    this.removeListener('execution:slice:new', onMessage);
                    resolve();
                }
            }, interval);
            const onMessage = (msg: Slice) => {
                clearInterval(intervalId);
                resolve(msg);
            };
            this.once('execution:slice:new', onMessage);
        });

        if (!slice) return;

        await this.sendUnavailable();

        return slice as Slice;
    }
}
