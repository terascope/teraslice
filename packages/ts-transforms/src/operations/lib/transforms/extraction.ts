
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class Extraction extends TransformOpBase {
    private isMutation: Boolean;
    private mutltiFieldParams: object;
    private regex?: RegExp;

    constructor(config: OperationConfig) {
        super(config);
        this.isMutation = config.mutate === true;
        const mutltiFieldParams = {};
        if (config.multivalue) {
            const targetSource = {};
            targetSource[config.target_field as string] = true;
            mutltiFieldParams[config._multi_target_field as string] = targetSource;
        }
        if (config.regex) {
            this.regex = this.formatRegex(config.regex);
        }
        this.mutltiFieldParams = mutltiFieldParams;
        if (_.get(this.config, 'end') === 'EOP') this.config.end = '&';
    }

    formatRegex(str: string): RegExp {
        if (str[0] === '/' && str[str.length - 1] === '/') {
            const fullExp = /\/(.*)\/(.*)/.exec(str);
            if (!fullExp) throw new Error(`cannot parse regex input: ${str}`);
            return new RegExp(fullExp[1], fullExp[2]);
        }
        return new RegExp(str);
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

            if (this.regex) {
                let extractedField;
                if (typeof data === 'string') extractedField = data.match(this.regex as RegExp);

                if (!extractedField && Array.isArray(data)) {
                    data.forEach((subData:any) => {
                        if (typeof subData === 'string') {
                            const subResults = subData.match(this.regex as RegExp);
                            if (subResults) extractedField = subResults;
                        }
                    });
                }

                if (extractedField) {
                    const regexResult = extractedField.length === 1 ? extractedField[0] : extractedField[1];
                    if (regexResult) extractedResult = regexResult;
                }

            } else if (this.config.start && this.config.end) {
                const { start, end } = this.config;

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
                    // TODO: this might have problems of multiple extractions on the same field
                    this.set(doc, extractedResult);
                    return doc;
                }
                const metaData = doc.getMetadata();
                if (this.config.multivalue) _.merge(metaData, { _multi_target_fields: this.mutltiFieldParams });
                return new DataEntity(_.set({}, this.target, extractedResult), metaData);
            }
        }
        if (this.isMutation && (_.keys(doc).length > 0)) return doc;
        return null;
    }
}
