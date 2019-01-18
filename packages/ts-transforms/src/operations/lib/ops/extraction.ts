
import _ from 'lodash';
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base';

export default class Extraction extends OperationBase {
    private config: OperationConfig;
    private isMutation: Boolean;
    private mutltiFieldParams: object;

    constructor(config: OperationConfig) {
        super(config);
        this.isMutation = config.mutate === true;
        this.config = config;
        const mutltiFieldParams = {};
        if (config.multivalue) {
            const targetSource = {};
            targetSource[config.target_field as string] = true;
            mutltiFieldParams[config._multi_target_field as string] = targetSource;
        }
        this.mutltiFieldParams = mutltiFieldParams;
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
        const data = _.get(doc, this.source);
        if (data !== undefined) {
            let extractedResult;

            if (this.config.regex) {
                const { regex } = this.config;
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
                    if (regexResult) extractedResult = regexResult;
                }

            } else if (this.config.start && this.config.end) {
                // tslint:disable-next-line
                let { start, end } = this.config;
                if (end === 'EOP') end = '&';

                if (typeof data === 'string') {
                    const extractedSlice = this.sliceString(data, start, end);
                    if (extractedSlice) extractedResult = extractedSlice;
                }
                if (Array.isArray(data)) {
                    data.forEach((subData:any) => {
                        if (typeof subData === 'string') {
                            const extractedSlice = this.sliceString(subData, start, end);
                            if (extractedSlice) extractedResult = extractedSlice;
                        }
                    });
                }
            } else {
                extractedResult = data;
            }

            if (extractedResult !== undefined)  {
                if (this.isMutation) {
                    if (this.config.multivalue) doc.setMetadata('_multi_target_fields', this.mutltiFieldParams);
                    return _.set(doc, this.target, extractedResult);
                }
                const metaData = doc.getMetadata();
                if (this.config.multivalue) _.merge(metaData, { _multi_target_fields: this.mutltiFieldParams });
                return new DataEntity(_.set({}, this.target, extractedResult), metaData);
            }
        }
        if (this.isMutation) return doc;
        return null;
    }
}
