import { Context, JobConfig, OpConfig } from '@terascope/teraslice-types';

export class Operation {

    public static schema : object = {};

    public static async validate(input: object): Promise<object>  {
        return input;
    }

    private readonly context: Context;
    private readonly jobConfig: JobConfig;
    private readonly opConfig: OpConfig;

    constructor(context: Context, jobConfig: JobConfig, opConfig: OpConfig) {
        this.context = context;
        this.jobConfig = jobConfig;
        this.opConfig = opConfig;
    }

    public async initialize(): Promise<void> {
        this.context.logger.debug(`${this.jobConfig.name}->${this.opConfig._op} is initialzing...`);
        return;
    }

    public async shutdown(): Promise<void> {
        this.context.logger.debug(`${this.jobConfig.name}->${this.opConfig._op} is shutting down...`);
        return;
    }

    public async onSliceInitialized(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    public async onSliceStarted(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    public async onSliceFinalizing(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    public async onSliceFinished(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    public async onSliceFailed(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    public async onSliceRetry(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }
}
