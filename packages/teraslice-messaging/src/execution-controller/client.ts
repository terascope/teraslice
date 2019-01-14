import { isString, pickBy } from 'lodash';
import * as core from '../messenger';
import * as i from './interfaces';

const ONE_MIN = 60 * 1000;

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

        this.handleResponse(this.socket, 'execution:slice:new', (msg: core.Message) => {
            if (this.listenerCount('execution:slice:new') === 0) {
                return { willProcess: false };
            }

            const willProcess = this.available;
            if (willProcess) {
                this.available = false;
                this.emit('execution:slice:new', {
                    payload: msg.payload
                });
            }

            return {
                willProcess,
            };
        });

        this.handleResponse(this.socket, 'execution:finished', (msg: core.Message) => {
            this.emit('execution:finished', {
                payload: msg.payload
            });
        });
    }

    onExecutionFinished(fn: () => void) {
        this.on('execution:finished', fn);
    }

    sendSliceComplete(payload: i.SliceCompletePayload) {
        return this.send('worker:slice:complete', pickBy(payload), {
            response: true,
            volatile: false,
        });
    }

    async waitForSlice(fn: i.WaitUntilFn = () => false, timeoutMs = 2 * ONE_MIN): Promise<i.Slice|undefined> {
        this.sendAvailable();

        const startTime = Date.now();

        const isExpired = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < timeoutMs) return false;

            // force the next time to send a new available message
            this.sendUnavailable();
            return true;
        };

        const slice = await new Promise((resolve) => {
            this.once('execution:slice:new', onMessage);

            const intervalId = setInterval(() => {
                if (this.serverShutdown || !this.ready || fn() || isExpired()) {
                    this.removeListener('execution:slice:new', onMessage);
                    finish();
                }
            }, 100);

            function onMessage(msg: core.EventMessage) {
                finish(msg.payload as i.Slice);
            }

            function finish(slice?: i.Slice) {
                clearInterval(intervalId);
                resolve(slice);
            }
        });

        if (!slice) return;

        return slice as i.Slice;
    }
}
