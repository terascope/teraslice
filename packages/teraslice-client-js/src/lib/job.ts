
import util from 'util';
import { pDelay, isString, toString, TSError, Assignment } from '@terascope/job-components';
import Client from './client';
import {
    ClientConfig,
    SearchParams,
    ExecutionStatus,
    ChangeWorkerQueryParams,
    ClusterState,
    ClusterProcess,
    JobProcesses
} from '../interfaces';

/*
 * This is basically a wrapper around the job_id that acts as a proxy
 * to the server. It looks like an object but does not store the job
 * state internally. Any access to the state currently goes to the server.
 * Depending on how usage of this API develops we may want to reconsider this.
 */
// @ts-ignore
function _deprecateSlicerName(fn) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

export default class Job extends Client {
    private _jobId: string;

    constructor(config:ClientConfig, jobId: string) {
        super(config);
        if (!jobId) {
            throw new TSError('Job requires jobId');
        }
        if (!isString(jobId)) {
            throw new TSError('Job requires jobId to be a string');
        }
        this._jobId = jobId;
        this.slicer = _deprecateSlicerName(this.slicer);
    }

    id() { return this._jobId; }

    async slicer() {
        return this.get(`/jobs/${this._jobId}/slicer`);
    }

    async controller() {
        return this.get(`/jobs/${this._jobId}/controller`);
    }

    async start(query?: SearchParams) {
        return this.post(`/jobs/${this._jobId}/_start`, null, { query });
    }

    async stop(query?: SearchParams) {
        return this.post(`/jobs/${this._jobId}/_stop`, null, { query });
    }

    async pause(query?: SearchParams) {
        return this.post(`/jobs/${this._jobId}/_pause`, null, { query });
    }

    async resume(query?: SearchParams) {
        return this.post(`/jobs/${this._jobId}/_resume`, null, { query });
    }

    async recover(query?: SearchParams) {
        return this.post(`/jobs/${this._jobId}/_recover`, null, { query });
    }

    async execution() {
        return this.get(`/jobs/${this._jobId}/ex`);
    }

    async exId() {
        const { ex_id: exId } = await this.get(`/jobs/${this._jobId}/ex`);
        return exId;
    }

    async status() {
        const { _status: status } = await this.get(`/jobs/${this._jobId}/ex`);
        return status;
    }

    async waitForStatus(target: ExecutionStatus, intervalMs = 1000, timeoutMs = 0) {
        const terminal = {
            terminated: true,
            failed: true,
            rejected: true,
            completed: true,
            stopped: true,
        };

        const startTime = Date.now();
        let uri = `/jobs/${this._jobId}/ex`;

        const checkStatus = async (): Promise<ExecutionStatus> => {
            let result;
            try {
                const ex = await this.get(uri, {
                    json: true,
                    timeout: intervalMs < 1000 ? 1000 : intervalMs,
                });
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
                // tslint:disable-next-line:max-line-length
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

        return Promise.resolve().then(() => checkStatus());
    }

    async config() {
        return this.get(`/jobs/${this._jobId}`);
    }

    async errors(query?: SearchParams) {
        return this.get(`/jobs/${this._jobId}/errors`, { query });
    }

    async workers() {
        const state = await this.get('/cluster/state');
        return this._filterProcesses(state, 'worker');
    }

    async changeWorkers(action:ChangeWorkerQueryParams, workerNum:number) {
        if (action == null || workerNum == null) {
            throw new TSError('changeWorkers requires action and count');
        }
        if (!['add', 'remove', 'total'].includes(action)) {
            throw new TSError('changeWorkers requires action to be one of add, remove, or total');
        }

        const query = {};
        query[action] = workerNum;
        return this.post(`/jobs/${this._jobId}/_workers`, null, { query, json: false });
    }

    private _filterProcesses(state:ClusterState, type:Assignment) {
        const results:JobProcesses[] = [];

        for (const [, node] of Object.entries(state)) {
            node.active.forEach((process:ClusterProcess) => {
                const { assignment, job_id: jobId } = process;
                if ((assignment && assignment === type) && (jobId && jobId === this._jobId)) {
                    const jobProcess = Object.assign({}, process, { node_id: node.node_id });
                    results.push(jobProcess);
                }
            });
        }

        return results;
    }
}
