import {
    jexl, extract, extractConfig, transformRecord, transformRecordConfig
} from './jexl';
import { FieldTransform, RecordTransform } from './transforms';

FieldTransform.repository.extract = extractConfig;
FieldTransform.extract = extract;

RecordTransform.repository.transformRecord = transformRecordConfig;
RecordTransform.transformRecord = transformRecord;

export * from './aggregation-frame';
export * from './aggregations';
export * from './builder';
export * from './column';
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
