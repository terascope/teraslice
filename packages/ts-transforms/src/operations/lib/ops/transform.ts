
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base';
import _ from 'lodash';

export default class Transform extends OperationBase {
    private config: OperationConfig;
    private isMutation: Boolean;

    constructor(config: OperationConfig) {
        super(config);
        this.isMutation = config.mutate === true;
        this.config = config;
    }

    sliceString(data: string, start:string, end: string): string | null {
        const indexStart = data.indexOf(start);
        if (indexStart !== -1) {
            const sliceStart = indexStart + start.length;
            let endInd = data.indexOf(end, sliceStart);
            if (endInd === -1) endInd = data.length;
            const extractedSlice = data.slice(sliceStart, endInd);
            if (extractedSlice) return data.slice(sliceStart, endInd);
        }
        return null;
    }

    run(doc: DataEntity): DataEntity | null {
        const { config, isMutation, target, source } = this;
        let data = doc[source];
        if (data) {
            const metaData = doc.getMetadata();
            let transformedResult;

            if (config.regex) {
                const { regex } = config;
                let extractedField;
                if (typeof data === 'string') extractedField = data.match(regex as string);

                if (!extractedField && Array.isArray(data)) {
                    data.forEach((subData:any) => {
                        if (typeof subData === 'string') {
                            const subResults = subData.match(regex as string);
                            if (subResults) extractedField = subResults;
                        }
                    });
                }

                if (extractedField) {
                    const regexResult = extractedField.length === 1 ? extractedField[0] : extractedField[1];
                    if (regexResult) transformedResult = regexResult;
                }

            } else if (config.start && config.end) {
                let { start, end } = config;
                if (end === "EOP") end = '&';

                if (typeof data === 'string') {
                    const extractedSlice = this.sliceString(data, start, end)
                    if (extractedSlice) transformedResult = extractedSlice;
                }
                if (Array.isArray(data)) {
                    data.forEach((subData:any) => {
                        if (typeof subData === 'string') {
                            const extractedSlice = this.sliceString(subData, start, end);
                            if (extractedSlice) transformedResult = extractedSlice;
                        }
                    });
                }
            } else {
                transformedResult = data;
            }

            if (transformedResult)  {
                if (isMutation) {
                    _.set(doc, target, transformedResult);
                    return doc;
                }
                return new DataEntity(_.set({}, target, transformedResult), metaData);
            }
        }
        if (isMutation) return doc;
        return null;
    }
}
