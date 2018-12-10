
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base';
import _ from 'lodash';

export default class Transform extends OperationBase {
    private config: OperationConfig;

    constructor(config: OperationConfig) {
        super()
        this.config = config;
    }

    run(doc: DataEntity | null): DataEntity | null {
        if (!doc) return doc;
        const { config } = this;
        let data = doc[config.source_field as string];

        if (data) {
            const metaData = doc.getMetadata();
            let transformedResult;
            if (config.regex) {
                if (data && typeof data === 'string') { 
                    const { regex } = config;
                    const extractedField = data.match(regex as string);
                    if (extractedField) {
                        const regexResult = extractedField.length === 1 ? extractedField[0] : extractedField[1];
                        if (regexResult) transformedResult = regexResult;
                    }
                }
            } else if (config.start && config.end) {
                    let { end } = config;
                    if (end === "EOP") end = '&'
                    const indexStart = data.indexOf(config.start) + config.start.length;
                    let endInd = data.indexOf(end);
                    if (endInd === -1) endInd = data.length;
                    const extractedSlice = data.slice(indexStart, endInd);
                    if (extractedSlice) transformedResult = data.slice(indexStart, endInd);
            } else {
                transformedResult = data;
            }

            if (transformedResult) return new DataEntity(_.set({}, config.target_field as string, transformedResult), metaData);
        }

        return null;
    }
}
