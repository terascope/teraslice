import assert from 'node:assert';
import bunyan from 'bunyan';
import dateMath from 'datemath-parser';
import moment from 'moment';
import { z, type ZodType, type RefinementCtx } from 'zod';
import { AnyObject, Terafoundation as TF } from '@terascope/types';
import { isBoolean, toBoolean } from './booleans.js';
import { isValidDate } from './dates.js';
import { isFunction } from './functions.js';
import { isInteger, toInteger, toIntegerOrThrow, toNumber } from './numbers.js';
import { isSimpleObject } from './objects.js';
import { isString, startsWith } from './strings.js';

const convictCompatibleBooleanFn = (value: unknown) => {
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return value;
};

export const formats: TF.Format[] = [
    {
        name: 'required_string',
        validate(val: unknown) {
            if (!val || !isString(val)) {
                throw new Error('This field is required and must be of type string');
            }
        }
    },
    {
        name: 'optional_string',
        validate(val: unknown) {
            if (!val) {
                return;
            }
            if (isString(val)) {
                return;
            }
            throw new Error('This field is optional but if specified it must be of type string');
        }
    },
    {
        name: 'optional_date',
        validate(val: unknown) {
            if (!val) {
                return;
            }
            if (isString(val) || isInteger(val)) {
                if (isValidDate(val)) {
                    return;
                }
            } else {
                throw new Error('parameter must be a string or number IF specified');
            }
        },
        coerce(val: any) {
            if (!val) {
                return val;
            }
            try {
                return dateMath.parse(`${val}`);
            } catch (err) {
                throw new Error(
                    `value: ${JSON.stringify(val)} cannot be coerced into a proper date
                        the error: ${err.stack}`
                );
            }
        },
    },
    {
        name: 'elasticsearch_name',
        validate(val: unknown) {
            if (typeof val !== 'string') {
                throw new Error(`value: ${val} must be a string`);
            }
            if (val.length > 255) {
                throw new Error(`value: ${val} should not exceed 255 characters`);
            }

            if (startsWith(val, '_')
                || startsWith(val, '-')
                || startsWith(val, '+')) {
                throw new Error(`value: ${val} should not start with _, -, or +`);
            }

            if (val === '.' || val === '..') {
                throw new Error(`value: ${val} should not equal . or ..`);
            }

            // NOTE: the \\\\ is necessary to match a single \ in this case
            const badChar = /[#*?"<>|/\\\\]/;
            if (badChar.test(val)) {
                throw new Error(`value: ${val} should not contain any invalid characters: #*?"<>|/\\`);
            }

            const upperRE = /[A-Z]/;
            if (upperRE.test(val)) {
                throw new Error(`value: ${val} should be lower case`);
            }
        },
    },
    {
        name: 'positive_int',
        validate(val: unknown) {
            const int = toInteger(val);
            if (int === false || int < 1) {
                throw new Error('must be valid integer greater than zero');
            }
        },
        coerce(val: any) {
            return toInteger(val) || 0;
        },
    },
    {
        name: 'optional_bool',
        validate(val: unknown) {
            if (!val) return;
            if (!isBoolean(val)) {
                throw new Error(`If specified, must be convertible to a boolean. Received: ${val}`);
            }
        },
        coerce: convictCompatibleBooleanFn,
    },
    {
        name: 'optional_int',
        validate(val: unknown) {
            if (!val) return;
            if (!isInteger(val)) {
                throw new Error(`If specified, must be a boolean, 'true', or 'false'. Received: ${val}`);
            }
        },
        coerce(val: unknown) {
            try {
                toIntegerOrThrow(val);
            } catch (err) {
                return val;
            }
        },
    },
    {
        name: 'duration',
        coerce: (v: string | number) => {
            if (typeof v === 'number') {
                return v;
            }
            let val;
            const split = v.split(' ');
            if (split.length == 1) {
                // It must be an integer in string form.
                val = parseInt(v, 10);
            } else {
                let unitString = split[1];
                // Add an "s" as the unit of measurement used in Moment
                if (!unitString.match(/s$/)) {
                    unitString += 's';
                }

                if (!isMomentUnitOfTime(unitString)) {
                    throw new Error(`Invalid duration unit: ${unitString}`);
                }
                val = moment.duration(
                    parseInt(split[0], 10),
                    unitString
                ).valueOf();
            }
            return val;
        },
        validate: function (x) {
            const err_msg = 'must be a positive integer or human readable string (e.g. 3000, "5 days")';

            if (Number.isInteger(x)) {
                assert(x >= 0, err_msg);
            } else {
                assert(x.match(/^(\d)+ (.+)$/), err_msg);
            }
        }
    },
    {
        name: 'timestamp',
        coerce: (v) => moment(v).valueOf(),
        validate: function (x) {
            assert(Number.isInteger(x) && x >= 0, 'must be a positive integer');
        }
    }
];

/**
 * Facade class used to validate convict style schemas using the Zod library
 */
export class SchemaValidator<T = AnyObject> {
    name: string;
    inputSchema: TF.Schema<T>;
    zodSchema: ZodType<T>;
    checkUndeclaredKeys: CheckUndeclaredKeys;
    envMap: Record<string, { envName: string; format: TF.ConvictFormat }> = {};
    argsMap: Record<string, { argName: string; format: TF.ConvictFormat }> = {};
    logger: bunyan;

    constructor(
        schema: TF.Schema<T>,
        name: string,
        extraFormats: TF.Format[] = [],
        checkUndeclaredKeys: CheckUndeclaredKeys = 'warn'
    ) {
        extraFormats.forEach((newFormat) => {
            let unique = true;
            formats.forEach((existingFormat) => {
                // find formats with same name
                if (existingFormat.name === newFormat.name) {
                    // find format with different functions
                    if (existingFormat.coerce?.toString() !== newFormat.coerce?.toString()
                        || existingFormat.validate?.toString() !== newFormat.validate?.toString()) {
                        throw new Error(`Custom formats library already contains a format named ${newFormat.name}`);
                    }
                    unique = false;
                }
            });
            if (unique) {
                formats.push(newFormat);
            }
        });

        this.name = name;
        this.logger = bunyan.createLogger({ name: 'SchemaValidator' });
        this.inputSchema = schema;
        this.zodSchema = this._convictStyleSchemaToZod(schema, name);
        this.checkUndeclaredKeys = checkUndeclaredKeys;
    }

    /**
     * Validate that a configuration conforms to the schema
     *
     * @param { any } config A configuration to validate
     * @returns { T } A valid object of type T
     */
    validate(config: any) {
        const finalConfig: any = config;

        // Node process arguments and environmental variables override
        // values from a configuration
        // precedence: args, env, loaded value from config, default
        for (const key in this.envMap) {
            const { envName, format } = this.envMap[key];
            if (envName in process.env) {
                let envVal;
                if (format === Boolean || format === 'Boolean') {
                    envVal = toBoolean(process.env[envName]);
                }
                if (format === Number || format === 'Number') {
                    envVal = toNumber(process.env[envName]);
                } else {
                    envVal = process.env[envName];
                }
                finalConfig[key] = envVal;
            }
        }

        for (const key in this.argsMap) {
            const { argName, format } = this.argsMap[key];
            // Find the arg either as exact match or with = syntax
            let argIndex = process.argv.indexOf(`--${argName}`);
            if (argIndex === -1) {
                // Look for --argName=value syntax
                argIndex = process.argv.findIndex((arg) => arg.startsWith(`--${argName}=`));
            }
            if (argIndex >= 2) { // argv flags start at index 2
                const flag = process.argv[argIndex];
                let argValue: string | number | boolean;
                if (flag.includes('=')) {
                    argValue = flag.split('=')[1];
                } else {
                    argValue = process.argv[argIndex + 1];
                }
                if (format === Boolean || format === 'Boolean') {
                    argValue = toBoolean(argValue);
                }
                if (format === Number || format === 'Number') {
                    argValue = toNumber(argValue);
                }
                finalConfig[key] = argValue;
            }
        }

        let validatedWithZod;

        try {
            validatedWithZod = this.zodSchema.parse(finalConfig);
        } catch (err) {
            throw new Error(`Zod parse error: ${err}`);
        }

        if (this.checkUndeclaredKeys !== 'allow') {
            const schemaKeys = this.getSchemaObjectKeys(this.zodSchema);
            if (schemaKeys) {
                for (const key in finalConfig) {
                    if (!schemaKeys.includes(key)) {
                        if (this.checkUndeclaredKeys === 'warn') {
                            this.logger.warn(`Key '${key}' is not declared in ${this.name} schema`);
                        } else if (this.checkUndeclaredKeys === 'strict') {
                            throw new Error(`Key '${key}' is not declared in ${this.name} schema`);
                        }
                    }
                }
            }
        }

        return validatedWithZod;
    }

    /**
     * convert a convict style schema to zod schema
     *
     * @param { Schema<T> } schema A convict style schema
     * @param { PropertyKey } parentKey Property name of a nested schema object
     *                                  or other identifier for the schema
     * @param { Format[] } extraFormats User defined formats to be used for schema validation
     * @returns { z.ZodType } A zod schema
     */
    _convictStyleSchemaToZod(
        schema: TF.Schema<T>,
        parentKey: PropertyKey,
    ) {
        const fields: Record<string, ZodType> = {};
        const defaults: Record<string, any> = {};

        if (!isSimpleObject(schema)) {
            return z.any().default(schema);
        }

        for (const key in schema) {
            const value = schema[key];
            if (isSchemaObj<T>(value)) {
                fields[key] = this._convictSchemaObjToZod(value, key);
                defaults[key] = value.default;
            } else {
                fields[key] = this._convictStyleSchemaToZod(
                    value as TF.Schema<T>,
                    `${parentKey.toString()}.${key}`
                );
                defaults[key] = fields[key].parse({});
            }
        }

        return z.looseObject(fields)
            .default(defaults) as z.ZodType<T>;
    }

    /**
     * Converts a convict style schema object to a zod schema
     * @param { TF.SchemaObj } schemaObj The schema object to convert
     * @param { PropertyKey } key The name of the property that uses the schemaObj
     * @returns { ZodType } A Zod schema object
     */
    _convictSchemaObjToZod(
        schemaObj: TF.SchemaObj,
        key: PropertyKey
    ) {
        let type: ZodType;
        let finalFormat: TF.ConvictFormat;

        if (schemaObj.format === undefined) {
            // If no format is set assume the format is the typeof the default value
            const defaultType = Object.prototype.toString.call(schemaObj.default);
            finalFormat = function (x: unknown) {
                assert(Object.prototype.toString.call(x) == defaultType,
                    ' should be of type ' + defaultType.replace(/\[.* |]/g, ''));
            };
            type = this._getBaseType(key, finalFormat);
        } else {
            type = this._getBaseType(key, schemaObj.format);
            finalFormat = this._getCustomFormatFromName(schemaObj.format) || schemaObj.format;
        }

        if (Object.hasOwn(schemaObj, 'default')) {
            try {
                this._validateDefault(type, schemaObj.default);
            } catch (err) {
                throw new Error(`Invalid default value for key ${key.toString()}: ${schemaObj.default}`);
            }
            type = type.default(schemaObj.default);
        }

        if (schemaObj.arg) {
            this.argsMap[key.toString()] = { argName: schemaObj.arg, format: finalFormat };
        }

        if (schemaObj.env) {
            this.envMap[key.toString()] = { envName: schemaObj.env, format: finalFormat };
        }

        if (isOfTypeFormat(finalFormat)) {
            // custom formats
            if (finalFormat.coerce && finalFormat.validate) {
                return type.transform((val, ctx) => {
                    try {
                        // Both coerce and validate are guaranteed to exist from the check above
                        const finalVal = finalFormat.coerce!(val);
                        finalFormat.validate!(finalVal, schemaObj);
                        return finalVal;
                    } catch (err) {
                        ctx.addIssue({
                            code: 'custom',
                            path: [key],
                            input: val,
                            message: err.message ? err.message : 'Validation failed',
                        });
                        return z.NEVER;
                    }
                });
            } else {
                return type.superRefine((val, ctx) => {
                    try {
                        if (finalFormat.validate) {
                            finalFormat.validate(val, schemaObj);
                        }
                    } catch (err) {
                        ctx.addIssue({
                            code: 'custom',
                            path: [key],
                            input: val,
                            message: err instanceof Error ? err.message : 'Validation failed',
                        });
                    }
                });
            }
        }

        if (isFunction(finalFormat)) {
            // formats defined in inline functions
            return type.superRefine((args: any, ctx: RefinementCtx<any>) => {
                try {
                    let val;
                    if (args === null || args === undefined) {
                        val = schemaObj.default;
                    } else {
                        val = args;
                    }
                    finalFormat(val);
                } catch (err) {
                    ctx.addIssue({
                        code: 'custom',
                        input: args,
                        message: err instanceof Error ? err.message : 'Validation failed',
                    });
                }
            });
        }

        return type;
    }

    /**
     * Determines the base type that a full schema will be built on
     * @param { PropertyKey } key The name of the property that uses the schemaObj
     * @param { TF.ConvictFormat } convictFormatValue A convict compatible format value
     * @returns { ZodType } The base type
     */
    _getBaseType(
        key: PropertyKey,
        convictFormatValue: TF.ConvictFormat,
    ) {
        let baseType: ZodType;

        switch (convictFormatValue) {
            case '*':
                baseType = z.any();
                break;
            case 'int':
                baseType = z.number().int();
                break;
            case 'port':
                baseType = z
                    .coerce.number()
                    .int()
                    .min(1)
                    .max(65535);
                break;
            case 'nat':
                baseType = z
                    .number()
                    .int()
                    .min(0);
                break;
            case 'url':
                baseType = z.url();
                break;
            case 'email':
                baseType = z.email();
                break;
            case 'ipaddress':
                baseType = z.union([z.ipv4(), z.ipv6()]);
                break;
            case 'String':
            case String:
                baseType = z.string();
                break;
            case 'Number':
            case Number:
                baseType = z.number();
                break;
            case 'Boolean':
            case Boolean:
                baseType = z.preprocess(
                    convictCompatibleBooleanFn,
                    z.boolean()
                );
                break;
            case 'Object':
            case Object:
                baseType = z.record(z.string(), z.any());
                break;
            case 'Array':
            case Array:
                baseType = z.array(z.any());
                break;
            case 'RegExp':
            case RegExp:
                baseType = z.instanceof(RegExp);
                break;
            case (this._isCustomFormatName(convictFormatValue) ? convictFormatValue : undefined):
            case (isFunction(convictFormatValue) ? convictFormatValue : undefined):
                // let the format function do all validation
                baseType = z.any();
                break;
            case (Array.isArray(convictFormatValue) ? convictFormatValue : undefined):
                baseType = z.enum(convictFormatValue as unknown as Array<any>);
                break;
            default:
                throw new Error(`Unrecognized convict format for key: ${key.toString()} cannot be converted to zod format: ${convictFormatValue}`);
        }

        return baseType;
    }

    /** Run the default value against the created schema to ensure it is valid */
    _validateDefault(type: z.ZodType, defaultVal: any) {
        if (defaultVal !== undefined && defaultVal !== null) {
            type.parse(defaultVal);
        }
    }

    /** Unwrap the wrappers on base schema object and retrieve all keys */
    getSchemaObjectKeys(schema: ZodType): string[] | undefined {
        let s: ZodType | any = schema;

        // unwrap known wrappers
        while (
            s instanceof z.ZodDefault
            || s instanceof z.ZodOptional
            || s instanceof z.ZodNullable
        ) {
            s = s.def.innerType;
        }

        if (s instanceof z.ZodObject) {
            return Object.keys(s.shape);
        }

        return undefined;
    }

    /** Look up a custom format by name and return the format object */
    _getCustomFormatFromName(format: TF.ConvictFormat | undefined) {
        if (typeof format !== 'string') return null;
        return formats.find(
            (obj: TF.Format) => obj.name === format
        );
    }

    /** Determine if a format is the name of a custom format */
    _isCustomFormatName(format: TF.ConvictFormat) {
        if (typeof format !== 'string') return false;
        const result = formats.filter(
            (obj: TF.Format) => obj.name === format
        );

        return result.length > 0;
    }
}

type CheckUndeclaredKeys = 'allow' | 'warn' | 'strict';

export function isSchemaObj<T>(value: unknown): value is TF.SchemaObj<T> {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const obj = value as Record<string, unknown>;

    if (!('default' in obj)) {
        return false;
    }

    if ('format' in obj) {
        const format = obj.format;
        const validFormat
            = typeof format === 'string'
                || typeof format === 'function'
                || typeof format === 'object'
                || Array.isArray(format)
                || format === String
                || format === Number
                || format === Boolean
                || format === Object
                || format === Array
                || format === RegExp;

        if (!validFormat) {
            return false;
        }
    }

    if ('doc' in obj && typeof obj.doc !== 'string') {
        return false;
    }

    if ('env' in obj && typeof obj.env !== 'string') {
        return false;
    }

    if ('arg' in obj && typeof obj.arg !== 'string') {
        return false;
    }

    return true;
}

export function isOfTypeFormat(value: unknown): value is TF.Format {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const obj = value as Record<string, unknown>;

    if ('name' in obj && typeof obj.name !== 'string' && obj.name !== undefined) {
        return false;
    }

    if ('coerce' in obj && typeof obj.coerce !== 'function' && obj.coerce !== undefined) {
        return false;
    }

    if ('validate' in obj && typeof obj.validate !== 'function' && obj.validate !== undefined) {
        return false;
    }

    if (!('name' in obj) && !('validate' in obj) && !('coerce' in obj)) {
        return false;
    }

    return true;
}

export function isMomentUnitOfTime(
    unitString: string
): unitString is moment.unitOfTime.DurationConstructor {
    // Helper function to create a type-checked array of valid units
    const units = <T extends readonly moment.unitOfTime.DurationConstructor[]>(
        arr: T
    ): T => arr;

    const validUnits = units([
        'year',
        'years',
        'y',
        'month',
        'months',
        'M',
        'week',
        'weeks',
        'w',
        'day',
        'days',
        'd',
        'hour',
        'hours',
        'h',
        'minute',
        'minutes',
        'm',
        'second',
        'seconds',
        's',
        'millisecond',
        'milliseconds',
        'ms',
        'quarter',
        'quarters',
        'Q'
    ]);

    return (validUnits as readonly string[]).includes(unitString);
}
