import { times } from '@terascope/core-utils';
import {
    ExecutionConfig, APIConfig, SliceAnalyticsData,
    Context
} from '../interfaces/index.js';
import Observer from './observer.js';

/**
 * An Observer for monitoring the Slice Analytics
 */
export default class JobObserver extends Observer {
    collectAnalytics: boolean;
    analyticsData: SliceAnalyticsData | undefined;

    // use to avoid undefinied variable issues
    protected _currentSliceId: string;
    // use to avoid undefinied variable issues
    protected _currentIndex: number;

    // the length of the operations
    private _opLength: number;

    // in-flight analytics
    private _initialized: OpAnalytics | null;

    constructor(context: Context, apiConfig: APIConfig, executionConfig: ExecutionConfig) {
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

    async onSliceInitialized(sliceId: string): Promise<void> {
        this._currentSliceId = sliceId;
        this._currentIndex = 0;

        if (this.collectAnalytics) {
            this.analyticsData = this.defaultAnalytics();
        }

        this._initialized = null;
    }

    onOperationStart(sliceId: string, index: number): void {
        this._currentSliceId = sliceId;
        this._currentIndex = index;

        if (!this.collectAnalytics) return;

        this._initialized = {
            memory: getMemoryUsage(),
            time: Date.now(),
        };
    }

    onOperationComplete(sliceId: string, index: number, processed: number): void {
        if (!this.collectAnalytics) return;
        if (this._initialized == null || !this.analyticsData) return;

        this._currentSliceId = sliceId;

        const { memory, time } = this._initialized;

        this.analyticsData.time[index] = Date.now() - time;
        this.analyticsData.size[index] = processed || 0;
        this.analyticsData.memory[index] = getMemoryUsage() - memory;

        this._initialized = null;
    }

    getAnalytics(): SliceAnalyticsData | undefined {
        if (!this.analyticsData) return;

        const { time, memory, size } = this.analyticsData;
        return {
            time: time.slice(),
            memory: memory.slice(),
            size: size.slice(),
        };
    }

    defaultAnalytics(): SliceAnalyticsData {
        return {
            time: initVals(this._opLength),
            memory: initVals(this._opLength),
            size: initVals(this._opLength),
        };
    }
}

function initVals(int: number) {
    return times(int, initVal);
}

function initVal() {
    return -1;
}

function getMemoryUsage() {
    return process.memoryUsage().heapUsed;
}

interface OpAnalytics {
    time: number;
    memory: number;
}
