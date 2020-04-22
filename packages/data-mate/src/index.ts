import DocumentMatcher from './document-matcher';
import { jexl, extract, extractConfig } from './jexl';
import { FieldTransform, RecordTransform } from './transforms';

FieldTransform.repository.extract = extractConfig;
FieldTransform.extract = extract;

export * from './validations';
export * from './interfaces';
export {
    DocumentMatcher,
    FieldTransform,
    RecordTransform,
    jexl
};
