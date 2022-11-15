import { DataFrame } from './data-frame/index.js';
import { jexl, setup, bridgeToJexl } from './jexl/index.js';
import { FieldValidator, RecordValidator } from './validations/index.js';

import { FieldTransform, RecordTransform,  } from './transforms/index.js';
import { AggregationFrame } from './aggregation-frame/AggregationFrame.js';

setup(FieldTransform);
setup(FieldValidator);
setup(RecordValidator);

const repoTransformRecord = RecordTransform.repository.transformRecord;
const transformRecordName = repoTransformRecord.fn.name;

jexl.addTransform(transformRecordName, bridgeToJexl(repoTransformRecord.fn.bind(jexl)))

declare module './aggregation-frame/AggregationFrame.js' {
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
export * from './vector/index.js';
export {
    FieldTransform,
    RecordTransform,
    FieldValidator,
    RecordValidator,
    jexl
};

export * from './adapters/index.js';
export * from './function-configs/index.js';
