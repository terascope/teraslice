import * as ts from '@terascope/utils';
import crypto from 'crypto';

import { Repository } from '../interfaces';

export const respoitory: Repository = {
    uppercase: { fn: uppercase, config: {} },
    truncate: { fn: truncate, config: { size: { type: 'Int!' } } },
    toBoolean: { fn: toBoolean, config: {} },
};

export function toBoolean(input: string) {
    return ts.toBoolean(input);
}

export function uppercase(input: string) {
    if (ts.isString(input)) return input.toUpperCase();
    return null;
}

export function toLowerCase(input: any){
    return input.toLowerCase();
}

export function trim(){

}

export function truncate(input: string, args: ts.AnyObject) {
    const { size } = args;
    // should we be throwing
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');
    if (ts.isString(input)) return input.slice(0, size);
    return null;
}

export function noramlizeBoolean(){}

export function noramlizeISDN(){
    const phoneNumber = new PhoneValidator(`+${data}`);
        const fullNumber = phoneNumber.getNumber();
        if (fullNumber) return String(fullNumber).slice(1);
        throw Error('could not normalize');
}
type Case = 'lowercase' | 'uppercase';

export function normalizeMacAddress(
    input: any,
    case = 'lowercase',
    preserveColons = false,
){
    let results = input;
        if (typeof input !== 'string') throw new Error('data must be a string');
        if (case === 'lowercase') results = results.toLowerCase();
        if (case === 'uppercase') results = results.toUpperCase();
        if (!preserveColons) results = results.replace(/:/gi, '');
        return results;
}

export function normalizeNumber(){
    if (typeof data === 'number') return data;
    if (typeof data === 'string') {
        const results = toNumber(data);
        if (Number.isNaN(results)) throw new Error('could not convert to a number');
        return results;
    }
    throw new Error('could not convert to a number');
}

export function toNumber(input: any){
    // TODO: does this check for isNAN
    return ts.isNumber(input);
}

export function decodeBase64(){
    return Buffer.from(data, 'base64').toString('utf8');
}

export function encodeBase64(){
    return Buffer.from(data).toString('base64');
}

export function decodeUrl(){
    return decodeURIComponent(data);
}

export function encodeUrl(){
    return encodeURIComponent(data);
}

export function decodeHex(){
    return Buffer.from(data, 'hex').toString('utf8');
}

export function encodeHex(){
    return Buffer.from(data).toString('hex');
}

// TODO: there should be a decode MD5?
export function encodeMD5(){
    return crypto.createHash('md5').update(data).digest('hex');
}

export function encodeSHA(input: any, hash = 'sha256', digest = 'hex'){
    return crypto.createHash(hash).update(input).digest(digest);
}

export function encodeSHA1(){
    return crypto.createHash('sha1').update(data).digest('hex');
}

export function decodeSHA1(){
    return crypto.createHash('sha1').update(data).digest('hex');
}

export function parseJSON(input: any){
    return JSON.parse(input)
}


export function dedup(){
    return uniq(arrayField)
}


export function parseGeoPoint(point: GeoPointInput): GeoPoint | null {
    let lat: number | undefined;
    let lon: number | undefined;

    if (typeof point === 'string') {
        if (point.match(',')) {
            [lat, lon] = ts.parseNumberList(point);
        } else {
            try {
                [lat, lon] = Object.values(geoHash.decode(point));
            } catch (err) {
                // do nothing
            }
        }
    } else if (Array.isArray(point)) {
        // array of points are meant to be lon/lat format
        [lon, lat] = ts.parseNumberList(point);
    } else if (ts.isPlainObject(point)) {
        const results = getLonAndLat(point, throwInvalid);
        if (results) [lat, lon] = results;
    }



    // data incoming is lat,lon and we must return lon,lat
    if (lat != null && lon != null) {
        return {
            lat,
            lon
        };
    }

    throw new ts.TSError(`Invalid geopoint given to parse, point:${point}`);
}

/** @returns {[lat, lon]} */
export function getLonAndLat(input: any, throwInvalid = true): [number, number] | null {
    let lat = input.lat || input.latitude;
    let lon = input.lon || input.longitude;

    if (isGeoShapePoint(input)) {
        [lon, lat] = input.coordinates;
    }

    if (throwInvalid && (!lat || !lon)) {
        throw new Error('Invalid geopoint object, it must contain keys lat,lon or latitude/longitude');
    }

    lat = toNumber(lat);
    lon = toNumber(lon);
    if (!isNumber(lat) || !isNumber(lon)) {
        if (throwInvalid) throw new Error('Invalid geopoint, lat and lon must be numbers');
        return null;
    }

    return [lat, lon];
}

export function extract() {
    function isMutation(configs: ExtractionConfig[]): boolean {
        return configs.some((config) => config.mutate === true);
    }

    function getSubslice(start: string, end: string) {
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

    type Cb = (data: any) => string|string[]|null;

    function extractField(data: any, fn: Cb, isMultiValue = true) {
        if (typeof data === 'string') {
            return fn(data);
        }

        if (Array.isArray(data)) {
            const results: string[] = [];

            data.forEach((subData: any) => {
                if (typeof subData === 'string') {
                    const extractedSlice = fn(subData);
                    if (extractedSlice) {
                        if (Array.isArray(extractedSlice)) {
                            results.push(...extractedSlice);
                        } else {
                            results.push(extractedSlice);
                        }
                    }
                }
            });

            if (results.length > 0) {
                if (isMultiValue) return results;
                return results[0];
            }
        }

        return null;
    }

    function matchRegex(config: ExtractionConfig) {
        return (data: string) => {
            const results = matchAll(config.regex as string, data);
            if (config.multivalue) return results;
            return results ? results[0] : results;
        };
    }

    function callExpression(exp: string, origin: DataEntity<AnyObject, {}>) {
        try {
            return jexl.evalSync(exp, origin);
        } catch (err) {
            const errMessage = `Invalid jexl expression: ${exp}, error: ${err.message}`;
            throw new TSError(errMessage);
        }
    }

    function extractAndTransferFields(
        data: any,
        dest: DataEntity,
        config: ExtractionConfig,
        origin: DataEntity
    ) {
        let extractedResult;

        if (data !== undefined) {
            if (config.regex) {
                const checkRegex = matchRegex(config);
                extractedResult = extractField(data, checkRegex, config.multivalue);
            } else if (config.start && config.end) {
                const { start, end } = config;
                const sliceString = getSubslice(start, end);
                extractedResult = extractField(data, sliceString, config.multivalue);
            } else if (config.exp) {
                extractedResult = callExpression(config.exp, origin);
            } else {
                extractedResult = data;
            }
        } else if (config.exp && config.source === undefined) {
            // this should be a set operation
            extractedResult = callExpression(config.exp, origin);
        }

        if (extractedResult !== undefined && extractedResult !== null) {
            set(dest, config.target, extractedResult);
            dest.setMetadata('hasExtractions', true);
        }
    }

    function hasExtracted(record: DataEntity) {
        return record.getMetadata('hasExtractions') === true;
    }

    function getData(config: ExtractionConfig, record: DataEntity) {
        if (config.deepSourceField) {
            return get(record, config.source as string);
        }
        return record[config.source as string];
    }

    export default class Extraction {
        private isMutation: boolean;
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
                if (config.end === 'EOP') config.end = '&';
                if (config.source && config.source.includes('.')) config.deepSourceField = true;
                return config;
            });

            this.configs = configs;
        }

        run(doc: DataEntity): DataEntity | null {
            let record: DataEntity;

            if (this.isMutation) {
                record = doc;
            } else {
                record = DataEntity.fork(doc, false);
            }

            for (const config of this.configs) {
                const data = getData(config, doc);
                extractAndTransferFields(data, record, config, doc);
            }

            if (hasExtracted(record) || this.isMutation) return record;
            return null;
        }

        extractionPhaseRun(doc: DataEntity, results: { entity: DataEntity; metadata: any }) {
            for (const config of this.configs) {
                const data = getData(config, doc);
                extractAndTransferFields(data, results.entity, config, doc);
            }
        }
    }

}
