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

AggregationFrame.prototype.run = async function run() {
    await this.execute();

    let dataFrame = new DataFrame(this.columns as any, {
        name: this.name,
        metadata: this.metadata,
    });

    if (this._sortField) {
        dataFrame = dataFrame.orderBy(
            this._sortField as any,
            this._sortDirection
        );
    }
    if (this._limit) {
        dataFrame = dataFrame.limit(
            this._limit
        );
    }

    this.clear();
    return dataFrame;
};

export * from './aggregation-frame';
export * from './aggregations';
export * from './builder';
export * from './column';
export * from './core';
export * from './core';
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
