import assert from 'node:assert';
import { z, ZodType, RefinementCtx } from 'zod';
import moment from 'moment';
import dateMath from 'datemath-parser';
import { isFunction } from './functions.js';
import { isString, startsWith } from './strings.js';
import { isInteger, toInteger } from './numbers.js';
import { isValidDate } from './dates.js';
import { diffJson } from 'diff';
import convict from 'convict';
// @ts-expect-error no types
import convict_format_with_validator from 'convict-format-with-validator';
// @ts-expect-error no types
import convict_format_with_moment from 'convict-format-with-moment';
import bunyan from 'bunyan';

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
                // Add an "s" as the unit of measurement used in Moment
                if (!split[1].match(/s$/)) {
                    split[1] += 's';
                }
                val = moment.duration(
                    parseInt(split[0], 10),
                    split[1] as moment.unitOfTime.DurationConstructor
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

export class SchemaValidator<T = any> {
    inputSchema: Schema<T>;
    zodSchema: ZodType<T>;
    convictSchema: convict.Config<T>;
    envMap: Record<string, string> = {};
    argsMap: Record<string, string> = {};
    logger: bunyan;

    constructor(
        schema: Schema<T>,
        parentKey: PropertyKey,
        extraFormats: Format[] = []
    ) {
        this.logger = bunyan.createLogger({ name: 'SchemaValidator' });
        this.inputSchema = schema;
        this.zodSchema = this._convictSchemaToZod(schema, parentKey, extraFormats);
        this.convictSchema = convict(schema);
    }

    validate(config: any) {
        const finalConfig: any = config;
        // precedence: args, env, loaded value (config), default
        for (const key in this.envMap) {
            const envVarName = this.envMap[key];
            if (envVarName in process.env) {
                finalConfig[key] = process.env[envVarName];
            }
        }

        for (const key in this.argsMap) {
            const argName = this.argsMap[key];
            const argIndex = process.argv.indexOf(argName);
            if (argIndex >= 2) { // command line arguments start at index 2
                const flag = process.argv[argIndex];
                let argValue: string;
                if (flag.includes('=')) {
                    argValue = flag.split('=')[1];
                } else {
                    argValue = process.argv[argIndex + 1];
                }
                finalConfig[key] = argValue;
            }
        }

        // FIXME: would it simplify things to set the defaults
        // here instead of adding default() to zodType?
        const validatedWithZod = this.zodSchema.parse(finalConfig);

        this.convictSchema.load(config);

        // convict only ever validated if cluster master
        // this.convictSchema.validate({
        //     allowed: true,
        // } as any);
        const validatedWithConvict = this.convictSchema.getProperties();
        const diff = diffJson(validatedWithConvict as object, validatedWithZod as object);
        if (diff.length > 1) {
            const difference = diff.filter((obj) => obj.added === true || obj.removed === true);
            this.logger.info({ schemaDiff: difference }, 'Difference between convict and zod schemas detected');
        }
        return validatedWithZod;
    }

    static getSchemaJSON(schema: ZodType) {
        return z.toJSONSchema(schema);
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
        convictSchema: Schema<T>,
        parentKey: PropertyKey,
        extraFormats: Format[] = []
    ) {
        const fields: Record<string, ZodType> = {};
        const defaults: Record<string, any> = {};

        if (extraFormats) {
            extraFormats.forEach((formatToAdd) => {
                if (!formats.some(
                    (existingFormat) => existingFormat.name === formatToAdd.name)
                ) {
                    formats.push(formatToAdd);
                }
            });
        }

        if (isSchemaObj<T>(convictSchema)) {
            return this._convictSchemaObjToZod(
                parentKey,
                convictSchema,
                extraFormats) as z.ZodType<T>;
        }

        for (const key in convictSchema) {
            const value = convictSchema[key];
            if (isSchemaObj<T>(value)) {
                fields[key] = this._convictSchemaObjToZod(key, value, extraFormats);
                defaults[key] = value.default;
            } else {
                fields[key] = this._convictSchemaToZod(
                    value as Schema<T>,
                    `${parentKey.toString()}.${key}`,
                    extraFormats
                );
                defaults[key] = fields[key].parse({});
            }
        }

        return z.looseObject(fields)
            .default(defaults) as z.ZodType<T>;
    }

    _convictSchemaObjToZod(
        key: PropertyKey,
        schemaObj: SchemaObj<T>,
        extraFormats: Format[]
    ) {
        let type: ZodType;

        if (schemaObj.format === undefined) {
            // default format is the typeof the default value
            const defaultType = Object.prototype.toString.call(schemaObj.default);
            const formatFn = function (x: unknown) {
                assert(Object.prototype.toString.call(x) == defaultType,
                    ' should be of type ' + defaultType.replace(/\[.* |]/g, ''));
            };

            type = this._convictFormatToZod(key, schemaObj, formatFn, extraFormats);
        } else {
            type = this._convictFormatToZod(
                key,
                schemaObj,
                schemaObj.format,
                extraFormats);
        }

        if (schemaObj.arg) {
            this.argsMap[key.toString()] = schemaObj.arg;
        }

        if (schemaObj.env) {
            this.envMap[key.toString()] = schemaObj.env;
        }

        if (schemaObj.sensitive) {
            // no zod equivalent
        }

        if (schemaObj.nullable) {
            // we want the format fn to control whether null is valid
        }

        return type;
    }

    _convictFormatToZod(
        key: PropertyKey,
        schemaObj: SchemaObj<T>,
        convictFormatValue: ConvictFormat,
        extraFormats: Format[]
    ): ZodType {
        let type: ZodType;

        switch (convictFormatValue) {
            case '*':
                type = z.any();
                break;
            case 'int':
                type = z.number().int();
                break;
            case 'port':
                type = z
                    .coerce.number()
                    .int()
                    .min(1)
                    .max(65535);
                break;
            case 'nat':
            case 'timestamp':
            case 'positive_int':
            case 'duration':
                type = z.any();
                break;
            case 'url':
                type = z.url();
                break;
            case 'email':
                type = z.email();
                break;
            case 'ipaddress':
                type = z.union([z.ipv4(), z.ipv6()]);
                break;
            case 'String':
            case String:
            case 'elasticsearch_Name':
            case 'required_String':
                type = z.string();
                break;
            case 'optional_String':
                type = z.string().optional();
                break;
            case 'Number':
            case Number:
                type = z.number();
                break;
            case 'Boolean':
            case Boolean:
                type = z.boolean();
                break;
            case 'Object':
            case Object:
                type = z.record(z.string(), z.any());
                break;
            case 'Array':
            case Array:
                type = z.array(z.any());
                break;
            case 'RegExp':
            case RegExp:
                type = z.instanceof(RegExp);
                break;
            case 'optional_Date':
                type = z.union([z.string(), z.number()]);
                break;
            case (isFunction(convictFormatValue) ? convictFormatValue : undefined):
            case ((extraFormats && extraFormats.length > 0)
                ? extraFormats.some((format) => format.name === convictFormatValue)
                    ? convictFormatValue
                    : undefined
                : undefined):
                // we can't predict the type of a schema defined function
                type = z.any();
                break;
            case (Array.isArray(convictFormatValue) ? convictFormatValue : undefined):
                type = z.enum(convictFormatValue as unknown as Array<any>);
                break;
            default:
                throw new Error(`Unrecognized convict format for key: ${key.toString()} cannot be converted to zod format: ${convictFormatValue}`);
        }

        if (Object.hasOwn(schemaObj, 'default')) {
            type = type.default(schemaObj.default);
        }

        const customFormat = getCustomFormat(convictFormatValue);
        const finalFormat: ConvictFormat = customFormat ?? convictFormatValue;

        if (isOfTypeFormat(finalFormat)) {
            if (finalFormat.coerce && finalFormat.validate) {
                return type.transform((val, ctx) => {
                    try {
                        let finalVal = val;
                        if (finalFormat.coerce) {
                            finalVal = finalFormat.coerce(val);
                        }

                        // FIXME : reconsider this
                        // with convict predefined formats, if nullable is true and val is null
                        // then null should be considered a valid value for the field and
                        // validation is skipped
                        const skipValidation = val === null && schemaObj.nullable === true;
                        if (finalFormat.validate && !skipValidation) {
                            finalFormat.validate(finalVal, schemaObj);
                        }

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
                        // FIXME : reconsider this
                        // with convict predefined formats, if nullable is true and val is null
                        // then null should be considered a valid value for the field and
                        // validation is skipped
                        const skipValidation = val === null && schemaObj.nullable === true;
                        if (finalFormat.validate && !skipValidation) {
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

        // FIXME need to double check Boolean, String, etc???
        if (isFunction(convictFormatValue)) {
            return type.superRefine((args: any, ctx: RefinementCtx<any>) => {
                try {
                    let val;
                    if (args === null || args === undefined) {
                        val = schemaObj.default;
                        // FIXME : reconsider this
                        // with convict inline functions, if the default value is 'null'
                        // or 'undefined' then it's considered a valid value for the
                        // field and the format Fn is skipped
                        if (val === null || val === undefined) {
                            return;
                        }
                    } else {
                        val = args;
                    }
                    convictFormatValue(val);
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
}

type ConvictFormat = any[] | PredefinedFormat | FormatFn | Format;

export interface Format {
    name?: string | undefined;
    validate?(val: any, schema: SchemaObj): void;
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

interface SchemaObj<T = any> {
    /**
     * You can define a configuration property as "required" without providing a default value.
     * Set its default to null and if your format doesn't accept null it will throw an error.
     */
    default: T | null;
    doc?: string | undefined;
    /**
     * From the implementation:
     *
     *  format can be a:
     *   - predefined type, as seen below
     *   - an array of enumerated values, e.g. ["production", "development", "testing"]
     *   - built-in JavaScript type, i.e. Object, Array, String, Number, Boolean
     *   - function that performs validation and throws an Error on failure
     *
     * If omitted, format will be set to the value of Object.prototype.toString.call
     * for the default value
     */
    format?: ConvictFormat;
    env?: string | undefined;
    arg?: string | undefined;
    sensitive?: boolean | undefined;
    nullable?: boolean | undefined;
    [key: string]: any;
}

export type Schema<T> = {
    [P in keyof T]: Schema<T[P]> | SchemaObj<T[P]>;
};

function isSchemaObj<T>(value: unknown): value is SchemaObj<T> {
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

function getCustomFormat(format: ConvictFormat) {
    if (typeof format !== 'string') return undefined;
    return formats.find((obj: Format) => obj.name === format);
}
