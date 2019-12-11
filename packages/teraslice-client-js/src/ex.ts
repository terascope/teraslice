import {
    isString,
    TSError,
    toString,
    pDelay,
    Assignment,
    toHumanTime
} from '@terascope/job-components';
import autoBind from 'auto-bind';
import Client from './client';

import {
    ClientConfig,
    SearchQuery,
    SearchOptions,
    PausedResponse,
    StoppedResponse,
    StopQuery,
    Execution,
    ResumeResponse,
    ExecutionStatus,
    StateErrors,
    RequestOptions,
    RecoverQuery,
    ControllerState,
    ClusterState,
    WorkerJobProcesses,
    ClusterProcess,
    ChangeWorkerResponse,
    ChangeWorkerQueryParams,
    JobIDResponse
} from './interfaces';

export default class Ex extends Client {
    private _exId: string;

    constructor(config: ClientConfig, exId: string) {
        validateExId(exId);

        super(config);
        // @ts-ignore
        autoBind(this);

        this._exId = exId;
    }

    id() { return this._exId; }

    async stop(query?: StopQuery, searchOptions: SearchOptions = {}): Promise<StoppedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/ex/${this._exId}/_stop`, null, options);
    }

    async pause(query?: SearchQuery, searchOptions: SearchOptions = {}): Promise<PausedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/ex/${this._exId}/_pause`, null, options);
    }

    async resume(query?: SearchQuery, searchOptions: SearchOptions = {}): Promise<ResumeResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/ex/${this._exId}/_resume`, null, options);
    }

    async recover(
        query: RecoverQuery = {},
        searchOptions: SearchOptions = {}
    ): Promise<Ex> {
        const options = this.makeOptions(query, searchOptions);
        const result: JobIDResponse = await this.post(`/ex/${this._exId}/_recover`, null, options);

        // support older version of teraslice
        if (!result.ex_id) {
            const { ex_id: exId } = await this.get(`/jobs/${result.job_id}/ex`);
            return new Ex(this._config, exId);
        }

        return new Ex(this._config, result.ex_id);
    }

    async status(requestOptions?: RequestOptions): Promise<ExecutionStatus> {
        const { _status: status } = await this.config(requestOptions);
        return status;
    }

    async slicer(requestOptions: RequestOptions = {}): Promise<ControllerState> {
        return this.get(`/ex/${this._exId}/slicer`, requestOptions);
    }

    async controller(requestOptions: RequestOptions = {}): Promise<ControllerState> {
        return this.get(`/ex/${this._exId}/controller`, requestOptions);
    }

    async config(requestOptions: RequestOptions = {}): Promise<Execution> {
        return this.get(`/ex/${this._exId}`, requestOptions);
    }

    async workers(requestOptions: RequestOptions = {}): Promise<WorkerJobProcesses[]> {
        const state: ClusterState = await this.get('/cluster/state', requestOptions);
        return filterProcesses<WorkerJobProcesses>(state, this._exId, 'worker');
    }

    async errors(options?: SearchQuery): Promise<StateErrors> {
        return this.get(`/ex/${this._exId}/errors`, {
            query: options,
        } as SearchOptions);
    }

    async changeWorkers(
        action: ChangeWorkerQueryParams,
        workerNum: number,
        requestOptions: RequestOptions = {}
    ): Promise<ChangeWorkerResponse | string> {
        if (action == null || workerNum == null) {
            throw new TSError('changeWorkers requires action and count');
        }
        if (!['add', 'remove', 'total'].includes(action)) {
            throw new TSError('changeWorkers requires action to be one of add, remove, or total');
        }

        const query = { [action]: workerNum };
        requestOptions.json = false;
        const options = this.makeOptions(query, requestOptions);

        const response = await this.post(`/ex/${this._exId}/_workers`, null, options);
        // for backwards compatability
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
        target: ExecutionStatus,
        intervalMs = 1000,
        timeoutMs = 0,
        requestOptions: RequestOptions = {}
    ): Promise<ExecutionStatus> {
        const terminal = {
            terminated: true,
            failed: true,
            rejected: true,
            completed: true,
            stopped: true,
        };

        const startTime = Date.now();
        const options = Object.assign({}, {
            json: true,
            timeout: intervalMs < 1000 ? 1000 : intervalMs,
        }, requestOptions);

        const checkStatus = async (): Promise<ExecutionStatus> => {
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
            if (terminal[result]) {
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
        throw new TSError('Ex requires exId');
    }
    if (!isString(exId)) {
        throw new TSError('Ex requires exId to be a string');
    }
}

function filterProcesses<T>(state: ClusterState, exId: string, type: Assignment) {
    const results: T[] = [];

    for (const [, node] of Object.entries(state)) {
        node.active.forEach((child: ClusterProcess) => {
            const { assignment, ex_id: procExId } = child;
            if ((assignment && assignment === type) && (procExId && procExId === exId)) {
                const jobProcess = Object.assign({}, child, { node_id: node.node_id });
                // @ts-ignore
                results.push(jobProcess);
            }
        });
    }

    return results;
}
