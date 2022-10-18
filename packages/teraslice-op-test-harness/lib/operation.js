import {
    readerShim, processorShim, registerApis,
    DataEntity, times,
} from '@terascope/job-components';
import { bindThis } from './utils.js';

export default class OperationTester {
    constructor({
        op,
        context,
        opConfig,
        logger,
        retryData,
        executionConfig,
        type
    }) {
        this.operationFn = op;
        this.context = context;
        this.logger = logger;
        this.retryData = retryData;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        registerApis(context, executionConfig);
        this.isProcessor = op.Processor || (op.newProcessor !== undefined);
        this.isReader = op.Fetcher || (type === 'reader' && op.newReader !== undefined);
        this.isSlicer = op.Slicer || (type === 'slicer' && op.newSlicer !== undefined);
        this.context.assignment = this.isSlicer ? 'execution_controller' : 'worker';
        this._hasInit = false;
        bindThis(this, OperationTester);
    }

    async init() {
        const {
            context,
            logger,
            retryData = [],
            operationFn: op,
            opConfig,
            executionConfig: exConfig
        } = this;
        const oldStyle = (op.newReader !== undefined || op.newProcessor !== undefined);

        if (!this._hasInit) {
            if (oldStyle) {
                if (this.isProcessor) {
                    const { Processor } = processorShim(op);
                    this.operation = new Processor(context, opConfig, exConfig);
                } else {
                    const { Fetcher, Slicer } = readerShim(op);
                    if (this.isReader) this.operation = new Fetcher(context, opConfig, exConfig);
                    if (this.isSlicer) this.operation = new Slicer(context, opConfig, exConfig);
                }
                if (logger) this.operation.logger = logger;
                await this.operation.initialize(retryData);
            } else {
                let newOp;
                if (op.Processor) newOp = new op.Processor(context, opConfig, exConfig);
                if (op.Fetcher) newOp = new op.Fetcher(context, opConfig, exConfig);
                if (op.Slicer) newOp = new op.Slicer(context, opConfig, exConfig);

                this.operation = newOp;
                if (logger) this.operation.logger = logger;
                await newOp.initialize();
            }

            this._hasInit = true;
        }
        return this;
    }

    async run(data) {
        if (!this._hasInit) await this.init();
        if (this.isSlicer) {
            const slicers = this.operation.slicers();
            await this.operation.handle();

            const slices = this.operation.getSlices(10000);
            const sliceRequests = [];
            const slicesBySlicers = [];

            for (const slice of slices) {
                if (slicesBySlicers[slice.slicer_id] == null) {
                    slicesBySlicers[slice.slicer_id] = [];
                }
                slicesBySlicers[slice.slicer_id].push(slice);
            }

            for (const perSlicer of slicesBySlicers) {
                const sorted = perSlicer.sort((a, b) => a.slicer_order - b.slicer_order);

                if (data && data.fullSlice) {
                    sliceRequests.push(...sorted);
                } else {
                    const mapped = sorted.map(({ request }) => request);
                    sliceRequests.push(...mapped);
                }
            }
            const remaining = slicers - sliceRequests.length;
            if (remaining > 0) {
                const nulls = times(remaining, () => null);
                return sliceRequests.concat(nulls);
            }

            return sliceRequests;
        }
        if (this.isProcessor) {
            return this.operation.handle(DataEntity.makeArray(data));
        }
        return this.operation.handle(data);
    }
}
