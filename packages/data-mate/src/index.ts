import { DataFrame } from './data-frame';
import {
    jexl, extract, extractConfig, transformRecord, transformRecordConfig
} from './jexl';
import { FieldTransform, RecordTransform } from './transforms';
import { AggregationFrame } from './aggregation-frame/AggregationFrame';

FieldTransform.repository.extract = extractConfig;
FieldTransform.extract = extract;

RecordTransform.repository.transformRecord = transformRecordConfig;
RecordTransform.transformRecord = transformRecord;

declare module './aggregation-frame/AggregationFrame' {
    interface AggregationFrame<T extends Record<string, any>> {
        /**
         * Run aggregations and flatten the grouped data into a DataFrame
         * @returns the new columns
        */
        run(): Promise<DataFrame<T>>;
    }
}

AggregationFrame.prototype.run = function run() {
    return this._run().then((columns) => new DataFrame(columns as any));
};
export * from './aggregation-frame';
export * from './aggregations';
export * from './builder';
export * from './column';
export * from './core-utils';
export * from './data';
export * from './data-frame';
export * from './document-matcher';
export * from './interfaces';
export * from './transforms/helpers';
export * from './validations';
export * from './vector';
export {
    FieldTransform,
    RecordTransform,
    jexl
};
