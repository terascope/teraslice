// Type definitions for queue
// Project: @terascope/teraslice-op-test-harness

import {
    ReaderModule,
    LegacyProcessor,
    ProcessorModule,
    OpConfig,
    ExecutionConfig,
    TestClientConfig,
    SliceRequest,
    SliceResult,
    ProcessorFn,
    CoreOperation,
    LegacyReader,
    DataEntity,
    Slice,
    TestContext,
} from '@terascope/job-components';
import { EventEmitter } from 'events';

export = OpTestHarness;

declare function OpTestHarness(op: OpTestHarness.OpTestHarnessInput): OpTestHarness.TestHarness;

export type OpTestHarnessInput = ProcessorModule|ReaderModule|LegacyProcessor|LegacyReader;
export type OpType = 'slicer'|'reader';
export interface InitOptions {
    opConfig?: OpConfig,
    executionConfig?: ExecutionConfig;
    retryData?: object[];
    clients?: TestClientConfig[];
    type: OpType;
}
export type LegacyRunResult = any;

export interface SampleData {
    ip:        string;
    userAgent: string;
    url:       string;
    uuid:      string;
    created:   string;
    ipv6:      string;
    location:  string;
    bytes:     number;
}

export interface SampleDataElasticSearch {
    took:      number;
    timed_out: boolean;
    _shards:   Shards;
    hits:      Hits;
}

interface Shards {
    total:      number;
    successful: number;
    failed:     number;
}

interface Hits {
    total:     number;
    max_score: number;
    hits:      Hit[];
}

interface Hit {
    _index:  string;
    _type:   string;
    _id:     string;
    _score:  number;
    _source: SampleData;
}

export interface SimpleData {
    name: string;
    age: number;
}

export interface SampleData {
    simple: SimpleData[];
    arrayLike: SampleData[];
    esLike: SampleDataElasticSearch;
}

export interface TestHarness {
    fakeLogger: Logger;
    schema: any;
    process: ProcessorFn;
    context: TestContext;
    data: SampleData;
    logger: Logger;
    events: EventEmitter;
    operationFn: OpTestHarnessInput;
    processFn: ProcessorFn;
    opConfig: OpConfig;
    executionConfig: ExecutionConfig;
    retryData?: object[];

    /**
     * Initialize and run an operation
    */
    processData(opConfig: OpConfig, data: DataInput[]): Promise<RunResult>;

    /**
     * Set the clients on the context
    */
    setClients(clients?: TestClientConfig[]): void;

    /**
     * Initialize the Processor or Reader
     * @returns an Operation
    */
    init(options: InitOptions): Promise<OperationTester>;

    /**
     * @deprecated
    */
    run(data: any, extraOpConfig?: object, extraContext?: object): LegacyRunResult;

    /**
     * @deprecated
    */
    runAsync(data: any, extraOpConfig?: object, extraContext?: object): Promise<LegacyRunResult>;

    /**
     * @deprecated
    */
    runSlices(slices: SliceRequest[], extraOpConfig?: object, extraContext?: object): Promise<SliceResult[]>;

    /**
     * @deprecated
    */
    getProcessor(opConfig: OpConfig, extraContext?: object): LegacyProcessor;

    /**
     * @deprecated
    */
    processFn(myProcessor: ProcessorFn, data: any): any;

    /**
     * @deprecated
    */
    emulateShutdown(): void;

    /**
     * @deprecated
    */
    runProcessorSpecs(processor: LegacyProcessor): void;
}

export type RunResult = DataEntity[]|Slice[]|SliceRequest[];

export interface SlicerRunInput {
    fullResponse?: boolean;
}

export type RunInput = SlicerRunInput|DataInput[];

export interface OperationTester {
    operation: CoreOperation;
    isReader: boolean;
    isSlicer: boolean;
    isProcessor: boolean;
    context: TestContext;
    logger: Logger;
    operationFn: OpTestHarnessInput;
    opConfig: OpConfig;
    executionConfig: ExecutionConfig;
    retryData?: object[];

    init(): Promise<Operation>;

    run(data: RunInput): Promise<RunResult>;
}
