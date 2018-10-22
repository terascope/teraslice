import { WorkerContext } from '../execution-context';
import { ExecutionConfig, SliceAnalyticsData } from '../interfaces';
import APICore from './core/api-core';
import { times } from '../utils';

/**
 * An Observer for monitoring the Slice Analyitcs
 */
export default class JobObserver extends APICore {
    collectAnalytics: boolean;
    analyticsData: SliceAnalyticsData;

    // use to avoid undefinied variable issues
    protected _currentSliceId: string;

    // the length of the operations
    private _opLength: number;

    // in-flight analytics
    private _initialized: OpAnalytics|null;

    constructor(context: WorkerContext, executionConfig: ExecutionConfig) {
        super(context, executionConfig);

        this._opLength = executionConfig.operations.length;

        this.collectAnalytics = executionConfig.analytics;
        this.analyticsData = this.defaultAnalytics();

        this._initialized = null;
        this._currentSliceId = '';
    }

    async onSliceInitialized(sliceId: string) {
        this._currentSliceId = sliceId;

        if (this.collectAnalytics) {
            this.analyticsData = this.defaultAnalytics();
            this.initOpAnalytics();
        }
    }

    onOperationComplete(index: number, sliceId: string, processed: number) {
        this._currentSliceId = sliceId;

        if (!this._initialized || !this.collectAnalytics) return;

        const { memory, time } = this._initialized;

        this.analyticsData.time[index] = Date.now() - time;
        this.analyticsData.size[index] = processed || 0;
        this.analyticsData.memory[index] = getMemoryUsage() - memory;

        const isLast = this._opLength >= (index + 2);
        if (isLast) return;

        this.initOpAnalytics();
    }

    private initOpAnalytics() {
        this._initialized = {
            memory: getMemoryUsage(),
            time: Date.now(),
        };
    }

    private defaultAnalytics(): SliceAnalyticsData {
        return {
            time: times(this._opLength, () => -1),
            memory: times(this._opLength, () => -1),
            size: times(this._opLength, () => -1),
        };
    }
}

function getMemoryUsage() {
    return process.memoryUsage().heapUsed;
}

interface OpAnalytics {
    time: number;
    memory: number;
}
