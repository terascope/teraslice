import jexlCore from 'jexl';
import {
    isNil, matchAll, isNotNil,
    isObjectEntity, TSError
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import { FieldTransform } from '../transforms/index.js';
import { FieldValidator, RecordValidator } from '../validations/index.js';
import {
    Repository, InputType, RepoConfig,
    ExtractFieldConfig, RecordInput
} from '../interfaces.js';

class Jexl extends jexlCore.Jexl {
    _context = {};

    evalSync(expression: string, _context: Record<string, any> | undefined) {
        let context;

        if (isNil(_context)) {
            context = this._context;
        } else {
            context = _context;
        }

        this._context = context;
        const exprObj = this.createExpression(expression);
        const results = exprObj.evalSync(context);
        this._context = {};
        return results;
    }
}

const jexl = new Jexl();

function bridgeToJexl(jexlClass: Jexl, fn: any) {
    return (value: any, _context: Record<string, any> | undefined, _config: any) => {
        let config;
        let context;

        if (isNil(config)) {
            context = jexlClass._context;
            config = _context;
        } else {
            config = _config;
            context = _context;
        }

        return fn(value, context, config as any);
    };
}

function setup(operationClass: any) {
    for (const config of Object.values(operationClass.repository as Repository)) {
        jexl.addTransform(config.fn.name, bridgeToJexl(jexl, config.fn));
    }
}

setup(FieldTransform);
setup(FieldValidator);
setup(RecordValidator);

jexl.addTransform(extract.name, bridgeToJexl(jexl, extract));
jexl.addTransform(transformRecord.name, bridgeToJexl(jexl, transformRecord));

export { jexl };

export const extractConfig: RepoConfig = {
    fn: extract,
    config: {
        regex: { type: FieldType.String },
        isMultiValue: { type: FieldType.Boolean },
        jexlExp: { type: FieldType.String },
        start: { type: FieldType.String },
        end: { type: FieldType.String }
    },
    output_type: FieldType.Any,
    primary_input_type: InputType.String
};

export function extract(
    input: any,
    parentContext: Record<string, any>,
    {
        regex, isMultiValue = true, jexlExp, start, end
    }: ExtractFieldConfig = {}
): RecordInput | null {
    if (isNil(input)) return null;

    function getSubslice() {
        const indexStart = input.indexOf(start);

        if (indexStart !== -1) {
            const sliceStart = indexStart + start.length;
            let endInd = input.indexOf(end, sliceStart);
            if (endInd === -1) endInd = input.length;
            const extractedSlice = input.slice(sliceStart, endInd);
            if (extractedSlice) return input.slice(sliceStart, endInd);
        }
        return null;
    }

    type Cb = (data: any) => string | string[] | null;

    function extractField(data: any, fn: Cb) {
        if (typeof data === 'string') {
            return fn(data);
        }

        if (FieldValidator.isArray(data)) {
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

    function matchRegex() {
        const results = matchAll(regex as string, input);
        if (isMultiValue) return results;
        return results ? results[0] : results;
    }

    function callExpression() {
        try {
            return jexl.evalSync(jexlExp as string, parentContext);
        } catch (err) {
            throw new TSError(err, {
                message: `Invalid jexl expression: ${jexlExp}`
            });
        }
    }

    function extractValue() {
        let extractedResult;

        if (regex) {
            extractedResult = extractField(input, matchRegex);
        } else if (start && end) {
            extractedResult = extractField(input, getSubslice);
        } else if (jexlExp) {
            extractedResult = callExpression();
        } else {
            extractedResult = input;
        }

        return extractedResult;
    }

    const results = extractValue();
    if (results == null) return null;

    return results;
}

export const transformRecordConfig: RepoConfig = {
    fn: transformRecord,
    config: {
        jexlExp: { type: FieldType.String },
        field: { type: FieldType.String },
    },
    output_type: FieldType.Object,
    primary_input_type: InputType.Object
};

export function transformRecord(
    input: RecordInput,
    parentContext: RecordInput,
    args: { jexlExp: string; field: string }
): RecordInput | null {
    if (isNil(input)) return null;
    if (isNil(args)) throw new Error('Argument parameters must be provided');
    if (!FieldValidator.isString(args.jexlExp) || !FieldValidator.isLength(args.jexlExp, parentContext, { min: 1 })) throw new Error('Argument parameter jexlExp must must be provided and be a string value');
    if (!FieldValidator.isString(args.field) || !FieldValidator.isLength(args.field, parentContext, { min: 1 })) throw new Error('Argument parameter field must must be provided and be a string value');

    if (FieldValidator.isArray(input)) {
        return input
            .map((data: any) => {
                if (!isObjectEntity(data)) return null;
                const value = jexl.evalSync(args.jexlExp, data);
                if (isNotNil(value)) data[args.field] = value;
                return data;
            })
            .filter(isNotNil);
    }

    if (!isObjectEntity(input)) return null;

    const value = jexl.evalSync(args.jexlExp, input);
    if (isNotNil(value)) input[args.field] = value;
    return input;
}
