
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { ExtractionConfig, InputOutputCardinality } from '../../../interfaces';

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

function getSubslice(start:string, end: string) {
    return (data: string) => {
        const indexStart = data.indexOf(start);
        if (indexStart !== -1) {
            const sliceStart = indexStart + start.length;
            let endInd = data.indexOf(end, sliceStart);
            if (endInd === -1) endInd = data.length;
            const extractedSlice = data.slice(sliceStart, endInd);
            if (extractedSlice) return data.slice(sliceStart, endInd);
        }
        return null;
    };
}

type Cb = (data:any) => string|null;

function extractField(data: any, fn: Cb, isMultiValue = true) {
    if (typeof data === 'string') {
        return fn(data);
    }

    if (Array.isArray(data)) {
        const results: string[] = [];
        data.forEach((subData:any) => {
            if (typeof subData === 'string') {
                const extractedSlice = fn(subData);
                if (extractedSlice) results.push(extractedSlice);
            }
        });

        if (results.length > 0) {
            if (isMultiValue) return results;
            return results[0];
        }
    }
    return null;
}

function matchRegex(regex: RegExp) {
    return (data:string) => {
        const results = data.match(regex);
        if (results) {
            return results.length === 1 ? results[0] : results[1];
        }
        return results;
    };
}

function extractAndTransferFields(record: DataEntity, dest: DataEntity, config: ExtractionConfig) {
    const data = _.get(record, config.source_field);
    if (data !== undefined) {
        let extractedResult;

        if (config.regex) {
            const checkRegex = matchRegex(config.regex);
            extractedResult = extractField(data, checkRegex, config.multivalue);
        } else if (config.start && config.end) {
            const { start, end } = config;
            const sliceString = getSubslice(start, end);
            extractedResult =  extractField(data, sliceString, config.multivalue);
        } else {
            extractedResult = data;
        }

        if (extractedResult !== null) {
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
                record = DataEntity.makeRaw({}, doc.getMetadata()).entity;
            }
        }

        for (let i = 0; i < this.configs.length; i += 1) {
            extractAndTransferFields(doc, record, this.configs[i]);
        }

        if (hasExtracted(record) || this.isMutation) return record;
        return null;
    }

    extractRun(doc: DataEntity, results: { entity: DataEntity, metadata: any }) {
        for (let i = 0; i < this.configs.length; i += 1) {
            extractAndTransferFields(doc, results.entity, this.configs[i]);
        }
    }
}
