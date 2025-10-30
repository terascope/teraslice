import {
    isString, TSError, toString,
    pDelay, toHumanTime
} from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import autoBind from 'auto-bind';
import Client from './client.js';
import { ClientConfig, RequestOptions } from './interfaces.js';

export default class Ex extends Client {
    private readonly _exId: string;

    constructor(config: ClientConfig, exId: string) {
        validateExId(exId);

        super(config);
        autoBind(this);

        this._exId = exId;
    }

    id(): string {
        return this._exId;
    }

    async stop(
        query?: Teraslice.StopQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiStoppedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/ex/${this._exId}/_stop`, null, options);
    }

    async pause(
        query?: Teraslice.SearchQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiPausedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/ex/${this._exId}/_pause`, null, options);
    }

    async resume(
        query?: Teraslice.SearchQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiResumeResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/ex/${this._exId}/_resume`, null, options);
    }

    async recover(
        query: Teraslice.RecoverQuery = {},
        searchOptions: RequestOptions = {}
    ): Promise<Ex> {
        const options = this.makeOptions(query, searchOptions);
        const result: Teraslice.ApiJobCreateResponse = await this.post(`/ex/${this._exId}/_recover`, null, options);

        // support older version of teraslice
        if (!result.ex_id) {
            const { ex_id: exId } = await this.get(`/jobs/${result.job_id}/ex`);
            return new Ex(this._config, exId);
        }

        return new Ex(this._config, result.ex_id);
    }

    async status(requestOptions?: RequestOptions): Promise<Teraslice.ExecutionStatus> {
        const { _status: status } = await this.config(requestOptions);
        return status;
    }

    async slicer(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionList> {
        return this.get(`/ex/${this._exId}/slicer`, requestOptions);
    }

    async controller(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionList> {
        return this.get(`/ex/${this._exId}/controller`, requestOptions);
    }

    async config(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionConfig> {
        return this.get(`/ex/${this._exId}`, requestOptions);
    }

    async workers(requestOptions: RequestOptions = {}): Promise<Teraslice.WorkerNode[]> {
        const state: Teraslice.ClusterState = await this.get('/cluster/state', requestOptions);
        return filterProcesses<Teraslice.WorkerNode>(state, this._exId, 'worker');
    }

    async errors(options?: Teraslice.SearchQuery): Promise<Teraslice.ErrorRecord[]> {
        return this.get(`/ex/${this._exId}/errors`, {
            searchParams: options,
        });
    }

    async changeWorkers(
        action: Teraslice.ChangeWorkerQueryParams,
        workerNum: number,
        requestOptions: RequestOptions = {}
    ): Promise<Teraslice.ChangeWorkerResponse | string> {
        if (action == null || workerNum == null) {
            throw new TSError('Change workers requires action and count', {
                statusCode: 400
            });
        }
        if (!['add', 'remove', 'total'].includes(action)) {
            throw new TSError('Change workers requires action to be one of add, remove, or total', {
                statusCode: 400
            });
        }

        const query = { [action]: workerNum };
        requestOptions.responseType = 'text';
        const options = this.makeOptions(query, requestOptions);

        const response = await this.post(`/ex/${this._exId}/_workers`, null, options);
        // for backwards compatibility
        if (typeof response === 'string') {
            try {
                return this.parse(response);
            } catch (err) {
                // do nothing
            }
        }

        return response;
    }

    async waitForStatus(
        target: Teraslice.ExecutionStatus,
        intervalMs = 1000,
        timeoutMs = 0,
        requestOptions: RequestOptions = {}
    ): Promise<Teraslice.ExecutionStatus> {
        const terminal = {
            [Teraslice.ExecutionStatusEnum.terminated]: true,
            [Teraslice.ExecutionStatusEnum.failed]: true,
            [Teraslice.ExecutionStatusEnum.rejected]: true,
            [Teraslice.ExecutionStatusEnum.completed]: true,
            [Teraslice.ExecutionStatusEnum.stopped]: true,
        };

        const startTime = Date.now();
        const options = Object.assign({}, {
            responseType: 'json',
            timeout: {
                request: intervalMs < 1000 ? 1000 : intervalMs
            },
        }, requestOptions);

        const checkStatus = async (): Promise<Teraslice.ExecutionStatus> => {
            let result;
            try {
                result = await this.status(options);
            } catch (err) {
                if (/(timeout|timedout)/i.test(toString(err))) {
                    await pDelay(intervalMs);
                    return checkStatus();
                }
                throw err;
            }

            if (result === target) {
                return result;
            }

            // These are terminal states for a job so if we're not explicitly
            // watching for these then we need to stop waiting as the job
            // status won't change further.
            if (result in terminal) {
                throw new TSError(
                    `Execution cannot reach the target status, "${target}", because it is in the terminal state, "${result}"`,
                    { context: { lastStatus: result } }
                );
            }

            const elapsed = Date.now() - startTime;
            if (timeoutMs > 0 && elapsed >= timeoutMs) {
                throw new TSError(
                    `Execution status failed to change from status "${result}" to "${target}" within ${toHumanTime(timeoutMs)}`,
                    { context: { lastStatus: result } }
                );
            }

            await pDelay(intervalMs);
            return checkStatus();
        };

        return checkStatus();
    }
}

function validateExId(exId?: string) {
    if (!exId) {
        throw new TSError('Ex requires exId', {
            statusCode: 400
        });
    }
    if (!isString(exId)) {
        throw new TSError('Ex requires exId to be a string', {
            statusCode: 400
        });
    }
}

function filterProcesses<T>(
    state: Teraslice.ClusterState,
    exId: string,
    type: Teraslice.Assignment
) {
    const results: T[] = [];

    for (const node of Object.values(state)) {
        // TODO: fixme
        node.active.forEach((child: any) => {
            const { assignment, ex_id: procExId } = child;
            if ((assignment && assignment === type) && (procExId && procExId === exId)) {
                const jobProcess = Object.assign({}, child, { node_id: node.node_id });
                results.push(jobProcess as any);
            }
        });
    }

    return results;
}
