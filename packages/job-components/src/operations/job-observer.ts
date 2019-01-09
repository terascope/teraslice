import { times } from '@terascope/utils';
import { ExecutionConfig, APIConfig, SliceAnalyticsData, WorkerContext } from '../interfaces';
import Observer from './observer';

/**
 * An Observer for monitoring the Slice Analyitcs
 */
export default class JobObserver extends Observer {
    collectAnalytics: boolean;
    analyticsData: SliceAnalyticsData|undefined;

    // use to avoid undefinied variable issues
    protected _currentSliceId: string;
    // use to avoid undefinied variable issues
    protected _currentIndex: number;

    // the length of the operations
    private _opLength: number;

    // in-flight analytics
    private _initialized: OpAnalytics|null;

    constructor(context: WorkerContext, apiConfig: APIConfig, executionConfig: ExecutionConfig) {
        super(context, apiConfig, executionConfig);

        this._opLength = executionConfig.operations.length;

        this.collectAnalytics = executionConfig.analytics;
        if (this.collectAnalytics) {
            this.analyticsData = this.defaultAnalytics();
        }

        this._initialized = null;
        this._currentSliceId = '';
        this._currentIndex = -1;
    }

    async onSliceInitialized(sliceId: string) {
        this._currentSliceId = sliceId;
        this._currentIndex = 0;

        if (this.collectAnalytics) {
            this.analyticsData = this.defaultAnalytics();
        }

        this._initialized = null;
    }

    onOperationStart(sliceId: string, index: number) {
        this._currentSliceId = sliceId;
        this._currentIndex = index;

        if (!this.collectAnalytics) return;

        this._initialized = {
            memory: getMemoryUsage(),
            time: Date.now(),
        };
    }

    onOperationComplete(sliceId: string, index: number, processed: number) {
        if (!this.collectAnalytics) return;
        if (this._initialized == null || !this.analyticsData) return;

        this._currentSliceId = sliceId;

        const { memory, time } = this._initialized;

        this.analyticsData.time[index] = Date.now() - time;
        this.analyticsData.size[index] = processed || 0;
        this.analyticsData.memory[index] = getMemoryUsage() - memory;

        this._initialized = null;
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
