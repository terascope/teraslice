
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { ExtractionConfig, InputOutputCardinality } from '../../../interfaces';
// @ts-ignore
import TransformOpBase from './base';

function isMutation(configs: ExtractionConfig[]): boolean {
    return _.some(configs, 'mutate');
}

function formatRegex(str: string): RegExp {
    if (str[0] === '/' && str[str.length - 1] === '/') {
        const fullExp = /\/(.*)\/(.*)/.exec(str);
        if (!fullExp) throw new Error(`cannot parse regex input: ${str}`);
        return new RegExp(fullExp[1], fullExp[2]);
    }
    return new RegExp(str);
}

function sliceString(data: string, start:string, end: string): string | null {
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

function extractAndTransferFields(record: DataEntity, dest: DataEntity, config: ExtractionConfig) {
    const data = _.get(record, config.source_field);
    if (data !== undefined) {
        let extractedResult;

        if (config.regex) {
            let extractedField;
            if (typeof data === 'string') extractedField = data.match(config.regex as RegExp);

            if (!extractedField && Array.isArray(data)) {
                const results: string[] = [];
                data.forEach((subData:any) => {
                    if (typeof subData === 'string') {
                        const subResults = subData.match(config.regex as RegExp);
                        if (subResults) {
                            const regexResult = subResults.length === 1 ? subResults[0] : subResults[1];
                            results.push(regexResult);
                        }
                    }
                });
                if (results.length > 0) extractedResult = results;
            }

            if (extractedField) {
                const regexResult = extractedField.length === 1 ? extractedField[0] : extractedField[1];
                if (regexResult) extractedResult = regexResult;
            }

        } else if (config.start && config.end) {
            const { start, end } = config;

            if (typeof data === 'string') {
                const extractedSlice = sliceString(data, start, end);
                if (extractedSlice) extractedResult = extractedSlice;
            } else if (Array.isArray(data)) {
                const results: string[] = [];
                data.forEach((subData:any) => {
                    if (typeof subData === 'string') {
                        const extractedSlice = sliceString(subData, start, end);
                        if (extractedSlice) results.push(extractedSlice);
                    }
                });
                if (results.length > 0) extractedResult = results;
            }
        } else {
            extractedResult = data;
        }

        if (extractedResult != null) {
            _.set(dest, config.target_field, extractedResult);
            dest.setMetadata('hasExtractions', true);
        }
    }
}

function hasExtracted(record: DataEntity) {
    return record.getMetadata('hasExtractions') === true;
}

export default class Extraction {
    private isMutation: Boolean;
    private configs: ExtractionConfig[];

    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(configArgs: ExtractionConfig | ExtractionConfig[]) {
        let configs: ExtractionConfig[];
        // if its not an array then its a post_process,
        if (!Array.isArray(configArgs)) {
            // we normalize configs
            configs = [configArgs];
        } else {
            configs = configArgs;
        }

        this.isMutation = isMutation(configs);

        configs = configs.map((config) => {
            // @ts-ignore
            if (config.regex) config.regex = formatRegex(config.regex);
            if (config.end === 'EOP') config.end = '&';
            return config;
        });
        this.configs = configs;
    }

    run(doc: DataEntity, destinationObj?: null|DataEntity): DataEntity | null {
        let record;
        if (this.isMutation) {
            record = doc;
        } else {
            if (destinationObj) {
                record = destinationObj;
            } else {
                const metaData = doc.getMetadata();
                record = DataEntity.make({}, metaData);
            }
        }

        for (let i = 0; i < this.configs.length; i += 1) {
            extractAndTransferFields(doc, record, this.configs[i]);
        }

        if (hasExtracted(record) || this.isMutation) return record;
        return null;
    }
}

// export default class Extraction extends TransformOpBase {
//     private isMutation: Boolean;
//     private regex?: RegExp;

//     constructor(config: OperationConfig) {
//         super(config);
//         this.isMutation = isMutation(config);
//         if (config.regex) {
//             config.regex = this.formatRegex(config.regex);
//         }
//         if (_.get(this.config, 'end') === 'EOP') this.config.end = '&';
//     }

//     formatRegex(str: string): RegExp {
//         if (str[0] === '/' && str[str.length - 1] === '/') {
//             const fullExp = /\/(.*)\/(.*)/.exec(str);
//             if (!fullExp) throw new Error(`cannot parse regex input: ${str}`);
//             return new RegExp(fullExp[1], fullExp[2]);
//         }
//         return new RegExp(str);
//     }

//     sliceString(data: string, start:string, end: string): string | null {
//         const indexStart = data.indexOf(start);
//         if (indexStart !== -1) {
//             const sliceStart = indexStart + start.length;
//             let endInd = data.indexOf(end, sliceStart);
//             if (endInd === -1) endInd = data.length;
//             const extractedSlice = data.slice(sliceStart, endInd);
//             if (extractedSlice) return data.slice(sliceStart, endInd);
//         }
//         return null;
//     }

//     run(doc: DataEntity): DataEntity | null {
//         const data = _.get(doc, this.source);
//         if (data !== undefined) {
//             let extractedResult;

//             if (config.regex) {
//                 let extractedField;
//                 if (typeof data === 'string') extractedField = data.match(config.regex as RegExp);

//                 if (!extractedField && Array.isArray(data)) {
//                     const results: string[] = [];
//                     data.forEach((subData:any) => {
//                         if (typeof subData === 'string') {
//                             const subResults = subData.match(config.regex as RegExp);
//                             if (subResults) {
//                                 const regexResult = subResults.length === 1 ? subResults[0] : subResults[1];
//                                 results.push(regexResult);
//                             }
//                         }
//                     });
//                     if (results.length > 0) extractedResult = results;
//                 }

//                 if (extractedField) {
//                     const regexResult = extractedField.length === 1 ? extractedField[0] : extractedField[1];
//                     if (regexResult) extractedResult = regexResult;
//                 }

//             } else if (this.config.start && this.config.end) {
//                 const { start, end } = this.config;

//                 if (typeof data === 'string') {
//                     const extractedSlice = this.sliceString(data, start, end);
//                     if (extractedSlice) extractedResult = extractedSlice;
//                 }
//                 if (Array.isArray(data)) {
//                     const results: string[] = [];
//                     data.forEach((subData:any) => {
//                         if (typeof subData === 'string') {
//                             const extractedSlice = this.sliceString(subData, start, end);
//                             if (extractedSlice) results.push(extractedSlice);
//                         }
//                     });
//                     if (results.length > 0) extractedResult = results;
//                 }
//             } else {
//                 extractedResult = data;
//             }

//             if (extractedResult !== undefined)  {
//                 const metaData = doc.getMetadata();

//                 if (this.isMutation) {
//                     // TODO: this might have problems of multiple extractions on the same field
//                     this.set(doc, extractedResult);
//                     return doc;
//                 }

//                 return DataEntity.make(_.set({}, this.target, extractedResult), metaData);
//             }
//         }
//         if (this.isMutation && (_.keys(doc).length > 0)) return doc;
//         return null;
//     }
// }
