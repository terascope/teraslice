import assert from 'node:assert';
import bunyan from 'bunyan';
import dateMath from 'datemath-parser';
import moment from 'moment';
import { z, ZodType, RefinementCtx } from 'zod';
import convict from 'convict';
// @ts-expect-error no types
import convict_format_with_validator from 'convict-format-with-validator';
// @ts-expect-error no types
import convict_format_with_moment from 'convict-format-with-moment';
import { AnyObject, Terafoundation } from '@terascope/types';
import { diffJson } from 'diff';
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

export const formats: Format[] = [
    {
        name: 'required_String',
        validate(val: unknown) {
            if (!val || !isString(val)) {
                throw new Error('This field is required and must by of type string');
            }
        },
        coerce(val: any) {
            return val;
        },
    },
    {
        name: 'optional_String',
        validate(val: unknown) {
            if (!val) {
                return;
            }
            if (isString(val)) {
                return;
            }
            throw new Error('This field is optional but if specified it must be of type string');
        },
        coerce(val: any) {
            return val;
        },
    },
    {
        name: 'optional_Date',
        validate(val: unknown) {
            if (!val) {
                return;
            }
            if (isString(val) || isInteger(val)) {
                if (isValidDate(val)) {
                    return;
                }
                try {
                    dateMath.parse(val);
                } catch (err) {
                    throw new Error(
                        `value: "${val}" cannot be coerced into a proper date
                            the error: ${err.stack}`
                    );
                }
            } else {
                throw new Error('parameter must be a string or number IF specified');
            }
        },
        coerce(val: any) {
            return val;
        },
    },
    {
        name: 'elasticsearch_Name',
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
        coerce(val) {
            return val;
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
            if (val === null) return;
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

formats.forEach((format) => {
    convict.addFormat(format);
});
convict.addFormats(convict_format_with_validator);
convict.addFormats(convict_format_with_moment);

export class SchemaValidator<T = AnyObject> {
    inputSchema: Terafoundation.Schema<T>;
    zodSchema: ZodType<T>;
    convictSchema: convict.Config<T>;
    envMap: Record<string, { envName: string; format: ConvictFormat }> = {};
    argsMap: Record<string, { argName: string; format: ConvictFormat }> = {};
    logger: bunyan;

    constructor(
        schema: Terafoundation.Schema<T>,
        name: string,
        extraFormats: Format[] = []
    ) {
        this.logger = bunyan.createLogger({ name: 'SchemaValidator' });
        this.inputSchema = schema;
        this.zodSchema = this._convictSchemaToZod(schema, name, extraFormats);
        this.convictSchema = convict(schema);
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
            const argIndex = process.argv.indexOf(argName);
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

        const validatedWithZod = this.zodSchema.parse(finalConfig);

        // convict only ever validated if cluster.isMaster was true
        // this.convictSchema.validate({
        //     allowed: true,
        // } as any);

        try {
            this.convictSchema.load(config);
        } catch (err) {
            this.logger.info(`Error loading convict schema. Convict/Zod diff will be inaccurate: ${err}`);
        }
        const validatedWithConvict = this.convictSchema.getProperties();

        const diff = diffJson(validatedWithConvict as object, validatedWithZod as object);
        if (diff.length > 1) {
            const difference = diff.filter((obj) => obj.added === true || obj.removed === true);
            this.logger.info({ schemaDiff: difference }, 'Difference between convict and zod schemas detected');
        }
        return validatedWithZod;
    }

    /**
     * convert a convict schema to zod schema
     *
     * @param { Schema<T> } convictSchema A convict style schema
     * @param { PropertyKey } parentKey Property name of a nested schema object
     *                                  or other identifier for the schema
     * @param { Format[] } extraFormats User defined formats to be used for schema validation
     * @returns { z.ZodType } A zod schema
     */
    _convictSchemaToZod(
        convictSchema: Terafoundation.Schema<T>,
        parentKey: PropertyKey,
        extraFormats: Format[] = []
    ) {
        const fields: Record<string, ZodType> = {};
        const defaults: Record<string, any> = {};

        if (!isSimpleObject(convictSchema)) {
            return z.any().default(convictSchema);
        }

        if (extraFormats) {
            extraFormats.forEach((formatToAdd) => {
                if (!formats.some(
                    (existingFormat) => existingFormat.name === formatToAdd.name)
                ) {
                    formats.push(formatToAdd);
                }
            });
        }

        for (const key in convictSchema) {
            const value = convictSchema[key];
            if (isSchemaObj<T>(value)) {
                fields[key] = this._convictSchemaObjToZod(value, key, extraFormats);
                defaults[key] = value.default;
            } else {
                fields[key] = this._convictSchemaToZod(
                    value as Terafoundation.Schema<T>,
                    `${parentKey.toString()}.${key}`,
                    extraFormats
                );
                defaults[key] = fields[key].parse({});
            }
        }

        // FixMe:
        // A looseObject allows keys not in the schema.
        // It is the equivalent of using convict.validate({ allowed: true }.
        // Job validation used { allowed: warn } so we should add the option to display
        // warnings for keys that are not in the schema.
        return z.looseObject(fields)
            .default(defaults) as z.ZodType<T>;
    }

    _convictSchemaObjToZod(
        schemaObj: Terafoundation.SchemaObj,
        key: PropertyKey,
        extraFormats: Format[]
    ) {
        let type: ZodType;
        let formatFn;

        if (schemaObj.format === undefined) {
            // If no format is set assume the format is the typeof the default value
            const defaultType = Object.prototype.toString.call(schemaObj.default);
            formatFn = function (x: unknown) {
                assert(Object.prototype.toString.call(x) == defaultType,
                    ' should be of type ' + defaultType.replace(/\[.* |]/g, ''));
            };

            type = this._getBaseType(key, formatFn, extraFormats);
        } else {
            type = this._getBaseType(key, schemaObj.format, extraFormats);
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
            this.argsMap[key.toString()] = { argName: schemaObj.arg, format: schemaObj.format };
        }

        if (schemaObj.env) {
            this.envMap[key.toString()] = { envName: schemaObj.env, format: schemaObj.format };
        }

        // FIXME: remove these last 3 checks before merging
        if (schemaObj.doc) {
            // we could store this in a zod metadata registry
            // we would have to deal with naming conflicts
        }

        if (schemaObj.sensitive) {
            // no zod equivalent
        }

        if (schemaObj.nullable) {
            // we will not implement this
            // we want the format fn to control whether null is valid
        }

        const customFormat = getCustomFormatFromName(schemaObj.format);
        const finalFormat: ConvictFormat = customFormat || formatFn || schemaObj.format;

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

    _getBaseType(
        key: PropertyKey,
        convictFormatValue: ConvictFormat,
        extraFormats: Format[]
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
            case 'duration':
            case 'elasticsearch_Name':
            case 'optional_Date':
            case 'optional_int':
            case 'optional_String':
            case 'positive_int':
            case 'timestamp':
                baseType = z.any();
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
            case 'required_String':
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
            case 'optional_bool':
                baseType = z.preprocess(
                    convictCompatibleBooleanFn,
                    z.union([z.boolean(), z.null()])
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
            case (isFunction(convictFormatValue) ? convictFormatValue : undefined):
            case ((extraFormats && extraFormats.length > 0)
                ? extraFormats.some((format) => format.name === convictFormatValue)
                    ? convictFormatValue
                    : undefined
                : undefined):
                // we can't predict the type of a schema defined function
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

    _validateDefault(type: z.ZodType, defaultVal: any) {
        if (defaultVal !== undefined && defaultVal !== null) {
            type.parse(defaultVal);
        }
    }
}

type ConvictFormat = any[] | PredefinedFormat | FormatFn | Format;

export interface Format {
    name?: string | undefined;
    validate?(val: any, schema: Terafoundation.SchemaObj): void;
    coerce?(val: any): any;
}

type PredefinedFormat
    = | '*'
        | 'int'
        | 'port'
        | 'windows_named_pipe'
        | 'port_or_windows_named_pipe'
        | 'url'
        | 'email'
        | 'ipaddress'
        | 'duration'
        | 'timestamp'
        | 'nat'
        | string
        | object
        | number
        | RegExp
        | boolean;

type FormatFn<T = any> = ((val: any) => asserts val is T) | ((val: any) => void);

function isSchemaObj<T>(value: unknown): value is Terafoundation.SchemaObj<T> {
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

    if ('sensitive' in obj && typeof obj.sensitive !== 'boolean') {
        return false;
    }

    if ('nullable' in obj && typeof obj.nullable !== 'boolean') {
        return false;
    }

    return true;
}

function isOfTypeFormat(value: unknown): value is Format {
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

function getCustomFormatFromName(format: ConvictFormat) {
    if (typeof format !== 'string') return undefined;
    return formats.find((obj: Format) => obj.name === format);
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
