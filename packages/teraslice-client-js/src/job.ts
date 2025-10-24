import util from 'node:util';
import autoBind from 'auto-bind';
import {
    pDelay, isString, toString,
    TSError,
} from '@terascope/core-utils';
import { toHumanTime } from '@terascope/date-utils'
import { Teraslice } from '@terascope/types';
import { ClientConfig, RequestOptions } from './interfaces.js';
import Client from './client.js';

/*
 * This is basically a wrapper around the job_id that acts as a proxy
 * to the server. It looks like an object but does not store the job
 * state internally. Any access to the state currently goes to the server.
 * Depending on how usage of this API develops we may want to reconsider this.
 */

function _deprecateSlicerName(fn: () => Promise<Teraslice.ExecutionList>) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

export default class Job extends Client {
    private readonly _jobId: string;

    constructor(config: ClientConfig, jobId: string) {
        super(config);
        if (!jobId || !isString(jobId)) {
            throw new TSError('Job requires jobId to be a string', {
                statusCode: 400
            });
        }
        this._jobId = jobId;
        this.slicer = _deprecateSlicerName(this.slicer);
        autoBind(this);
    }

    id(): string {
        return this._jobId;
    }

    async slicer(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionList> {
        return this.get(`/jobs/${this._jobId}/slicer`, requestOptions);
    }

    async controller(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionList> {
        return this.get(`/jobs/${this._jobId}/controller`, requestOptions);
    }

    async start(
        query?: Teraslice.SearchQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiJobCreateResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_start`, null, options);
    }

    async stop(
        query?: Teraslice.StopQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiStoppedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_stop`, null, options);
    }

    async pause(
        query?: Teraslice.SearchQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiPausedResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_pause`, null, options);
    }

    async resume(
        query?: Teraslice.SearchQuery,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiResumeResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_resume`, null, options);
    }

    async recover(
        query: Teraslice.RecoverQuery = {},
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ApiJobCreateResponse> {
        const options = this.makeOptions(query, searchOptions);
        return this.post(`/jobs/${this._jobId}/_recover`, null, options);
    }

    async update(jobSpec: Teraslice.JobConfig): Promise<Teraslice.JobConfig> {
        return this.put(`/jobs/${this._jobId}`, jobSpec);
    }

    async updatePartial(
        jobSpec: Partial<Teraslice.JobConfig>
    ): Promise<Teraslice.JobConfig> {
        const current = await this.config();
        const body: Teraslice.JobConfig = Object.assign({}, current, jobSpec);
        return this.update(body);
    }

    async deleteJob(): Promise<Teraslice.JobConfig> {
        return this.delete(`/jobs/${this._jobId}`);
    }

    async execution(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionConfig> {
        return this.get(`/jobs/${this._jobId}/ex`, requestOptions);
    }

    async exId(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionIDResponse> {
        const { ex_id: exId } = await this.get(`/jobs/${this._jobId}/ex`, requestOptions);
        return exId;
    }

    async status(requestOptions: RequestOptions = {}): Promise<Teraslice.ExecutionStatus> {
        const { _status: status } = await this.get(`/jobs/${this._jobId}/ex`, requestOptions);
        return status;
    }

    async waitForStatus(
        target: Teraslice.ExecutionStatus[] | Teraslice.ExecutionStatus,
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
        let exId: string;

        const checkStatus = async (): Promise<Teraslice.ExecutionStatus> => {
            let result;
            try {
                const ex = await this.get<Teraslice.ExecutionConfig>(`/jobs/${this._jobId}/ex`, options);
                if (exId && ex.ex_id !== exId) {
                    console.warn(`[WARNING] the execution ${ex.ex_id} has changed from ${exId}`);
                }
                exId = ex.ex_id;
                result = ex._status;
            } catch (err) {
                if (/(timeout|timedout)/i.test(toString(err))) {
                    await pDelay(intervalMs);
                    return checkStatus();
                }
                throw err;
            }

            if (result === target || (Array.isArray(target) && target.includes(result))) {
                return result;
            }

            // These are terminal states for a job so if we're not explicitly
            // watching for these then we need to stop waiting as the job
            // status won't change further.
            if (result in terminal) {
                throw new TSError(
                    `Job cannot reach the target status, "${target}", because it is in the terminal state, "${result}"`,
                    { context: { lastStatus: result } }
                );
            }

            const elapsed = Date.now() - startTime;
            if (timeoutMs > 0 && elapsed >= timeoutMs) {
                throw new TSError(
                    `Job status failed to change from status "${result}" to "${target}" within ${toHumanTime(timeoutMs)}`,
                    { context: { lastStatus: result } }
                );
            }

            await pDelay(intervalMs);
            return checkStatus();
        };

        return checkStatus();
    }

    async config(requestOptions: RequestOptions = {}): Promise<Teraslice.JobConfig> {
        return this.get(`/jobs/${this._jobId}`, requestOptions);
    }

    async errors(
        query: Teraslice.SearchQuery = {},
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ErrorRecord[]> {
        return this.get(`/jobs/${this._jobId}/errors`, this.makeOptions(query, searchOptions));
    }

    async workers(requestOptions: RequestOptions = {}): Promise<Teraslice.WorkerNode[]> {
        const state: Teraslice.ClusterState = await this.get('/cluster/state', requestOptions);
        return filterProcesses<Teraslice.WorkerNode>(state, this._jobId, 'worker');
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

function filterProcesses<T>(
    state: Teraslice.ClusterState,
    jobId: string,
    type: Teraslice.Assignment
) {
    const results: T[] = [];

    for (const [, node] of Object.entries(state)) {
        // TODO: fix this
        node.active.forEach((child: any) => {
            if (child.job_id) {
                const { assignment, job_id: procJobId } = child;
                if ((assignment && assignment === type) && (procJobId && procJobId === jobId)) {
                    const jobProcess = Object.assign({}, child, { node_id: node.node_id });
                    results.push(jobProcess);
                }
            }
        });
    }

    return results;
}
