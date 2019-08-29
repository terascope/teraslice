
import util from 'util';
import autoBind from 'auto-bind';
import {
    pDelay,
    isString,
    toString,
    TSError,
    Assignment,
} from '@terascope/job-components';
import {
    ClientConfig,
    SearchQuery,
    ExecutionStatus,
    ChangeWorkerQueryParams,
    ClusterState,
    ClusterProcess,
    ControllerState,
    JobsGetResponse,
    StateErrors,
    WorkerJobProcesses,
    SearchOptions,
    ChangeWorkerResponse,
    RequestOptions,
    ExecutionIDResponse,
    ExecutionGetResponse,
    RecoverQuery,
    ResumeResponse,
    StoppedResponse,
    PausedResponse,
    JobIDResponse,
    StopQuery
} from './interfaces';
import Client from './client';

/*
 * This is basically a wrapper around the job_id that acts as a proxy
 * to the server. It looks like an object but does not store the job
 * state internally. Any access to the state currently goes to the server.
 * Depending on how usage of this API develops we may want to reconsider this.
 */

function _deprecateSlicerName(fn: () => Promise<ControllerState>) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

export default class Job extends Client {
    private _jobId: string;

    constructor(config: ClientConfig, jobId: string) {
        super(config);
        if (!jobId) {
            throw new TSError('Job requires jobId');
        }
        if (!isString(jobId)) {
            throw new TSError('Job requires jobId to be a string');
        }
        this._jobId = jobId;
        this.slicer = _deprecateSlicerName(this.slicer);
        // @ts-ignore
        autoBind(this);
    }

    id() { return this._jobId; }

    async slicer(requestOptions: RequestOptions = {}): Promise<ControllerState> {
        return this.get(`/jobs/${this._jobId}/slicer`, requestOptions);
    }

    async controller(requestOptions: RequestOptions = {}): Promise<ControllerState> {
        return this.get(`/jobs/${this._jobId}/controller`, requestOptions);
    }

    async start(query?: SearchQuery, searchOptions: SearchOptions = {}): Promise<JobIDResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_start`, null, options);
    }

    async stop(query?: StopQuery, searchOptions: SearchOptions = {}): Promise<StoppedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_stop`, null, options);
    }

    async pause(query?: SearchQuery, searchOptions: SearchOptions = {}): Promise<PausedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_pause`, null, options);
    }

    async resume(query?: SearchQuery, searchOptions: SearchOptions = {}): Promise<ResumeResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_resume`, null, options);
    }

    async recover(
        query: RecoverQuery = {},
        searchOptions: SearchOptions = {}
    ): Promise<JobIDResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_recover`, null, options);
    }

    async execution(requestOptions: RequestOptions = {}): Promise<ExecutionGetResponse> {
        return this.get(`/jobs/${this._jobId}/ex`, requestOptions);
    }

    async exId(requestOptions: RequestOptions = {}): Promise<ExecutionIDResponse> {
        const { ex_id: exId } = await this.get(`/jobs/${this._jobId}/ex`, requestOptions);
        return exId;
    }

    async status(requestOptions: RequestOptions = {}): Promise<ExecutionStatus> {
        const { _status: status } = await this.get(`/jobs/${this._jobId}/ex`, requestOptions);
        return status;
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
        let uri = `/jobs/${this._jobId}/ex`;
        const options = Object.assign({}, {
            json: true,
            timeout: intervalMs < 1000 ? 1000 : intervalMs,
        }, requestOptions);

        const checkStatus = async (): Promise<ExecutionStatus> => {
            let result;
            try {
                const ex = await this.get(uri, options);
                uri = `/ex/${ex.ex_id}`;
                result = ex._status;
            } catch (err) {
                if (toString(err).includes('TIMEDOUT')) {
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
                    `Job cannot reach the target status, "${target}", because it is in the terminal state, "${result}"`,
                    { context: { lastStatus: result } }
                );
            }

            const elapsed = Date.now() - startTime;
            if (timeoutMs > 0 && elapsed >= timeoutMs) {
                throw new TSError(
                    `Job status failed to change from status "${result}" to "${target}" within ${timeoutMs}ms`,
                    { context: { lastStatus: result } }
                );
            }

            await pDelay(intervalMs);
            return checkStatus();
        };

        return checkStatus();
    }

    async config(requestOptions: RequestOptions = {}): Promise<JobsGetResponse> {
        return this.get(`/jobs/${this._jobId}`, requestOptions);
    }

    async errors(query: SearchQuery = {}, searchOptions: SearchOptions = {}): Promise<StateErrors> {
        return this.get(`/jobs/${this._jobId}/errors`, this.makeOptions(query, searchOptions));
    }

    async workers(requestOptions: RequestOptions = {}): Promise<WorkerJobProcesses[]> {
        const state: ClusterState = await this.get('/cluster/state', requestOptions);
        return filterProcesses<WorkerJobProcesses>(state, this._jobId, 'worker');
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

        const response = await this.post(`/jobs/${this._jobId}/_workers`, null, options);
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
}

function filterProcesses<T>(state: ClusterState, jobId: string, type: Assignment) {
    const results: T[] = [];

    for (const [, node] of Object.entries(state)) {
        node.active.forEach((child: ClusterProcess) => {
            const { assignment, job_id: procJobId } = child;
            if ((assignment && assignment === type) && (procJobId && procJobId === jobId)) {
                const jobProcess = Object.assign({}, child, { node_id: node.node_id });
                // @ts-ignore
                results.push(jobProcess);
            }
        });
    }

    return results;
}
