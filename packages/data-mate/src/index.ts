import DocumentMatcher from './document-matcher';
import {
    jexl, extract, extractConfig, transformRecord, transformRecordConfig
} from './jexl';
import { FieldTransform, RecordTransform } from './transforms';

FieldTransform.repository.extract = extractConfig;
FieldTransform.extract = extract;

RecordTransform.repository.transformRecord = transformRecordConfig;
RecordTransform.transformRecord = transformRecord;

export * from './validations';
export * from './interfaces';
export {
    DocumentMatcher,
    FieldTransform,
    RecordTransform,
    jexl
};
