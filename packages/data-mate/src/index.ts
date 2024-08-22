import { DataFrame } from './data-frame/index.js';
import {
    jexl, extract, extractConfig,
    transformRecord, transformRecordConfig
} from './jexl/index.js';
import {
    FieldTransform as FTransform,
    RecordTransform as RTransform
} from './transforms/index.js';
import { AggregationFrame } from './aggregation-frame/AggregationFrame.js';
import { FieldTransformInterface, RecordTransformInterface } from './interfaces.js';

// import are immutable, so we rename and clone to alter methods
const tmpFieldTransform = { };
for (const key of Object.keys(FTransform)) {
    tmpFieldTransform[key] = FTransform[key];
}
(tmpFieldTransform as FieldTransformInterface).repository.extract = extractConfig;
(tmpFieldTransform as FieldTransformInterface).extract = extract;
const FieldTransform: FieldTransformInterface = tmpFieldTransform as FieldTransformInterface;

const tmpRecordTransform = {};
for (const key of Object.keys(RTransform)) {
    tmpRecordTransform[key] = RTransform[key];
}
(tmpRecordTransform as RecordTransformInterface).repository.transformRecord = transformRecordConfig;
(tmpRecordTransform as RecordTransformInterface).transformRecord = transformRecord;
const RecordTransform: RecordTransformInterface = tmpRecordTransform as RecordTransformInterface;

declare module './aggregation-frame/AggregationFrame' {
    interface AggregationFrame<T extends Record<string, any>> {
        /**
         * Run aggregations and flatten the grouped data into a DataFrame
         * @returns the new columns
        */
        run(): Promise<DataFrame<T>>;
    }
}

AggregationFrame.prototype.run = async function run() {
    await this.execute();

    let dataFrame = new DataFrame(this.columns as any, {
        name: this.name,
        metadata: this.metadata,
    });

    const aggFrame = this as any;
    if (aggFrame._sortFields?.length) {
        dataFrame = dataFrame.orderBy(
            aggFrame._sortFields,
        );
    }
    if (aggFrame._limit != null) {
        dataFrame = dataFrame.limit(aggFrame._limit);
    }

    this.reset();
    return dataFrame;
};

const aggregationFrameMethods = Reflect.ownKeys(AggregationFrame.prototype);
for (const dataFrameMethod of Reflect.ownKeys(DataFrame.prototype)) {
    if (!aggregationFrameMethods.includes(dataFrameMethod)) {
        AggregationFrame.prototype[dataFrameMethod] = () => {
            throw new Error(
                `Unsupported method on ${String(dataFrameMethod)} AggregationFrame.
Use it before DataFrame.aggregate or after AggregationFrame.run()`
            );
        };
    }
}

export * from './aggregation-frame/index.js';
export * from './aggregations/index.js';
export * from './builder/index.js';
export * from './column/index.js';
export * from './core/index.js';
export * from './core/index.js';
export * from './data-frame/index.js';
export * from './document-matcher/index.js';
export * from './interfaces.js';
export * from './transforms/helpers.js';
export * from './validations/index.js';
export * from './vector/index.js';
export {
    FieldTransform,
    RecordTransform,
    jexl
};

export * from './adapters/index.js';
export * from './function-configs/index.js';
