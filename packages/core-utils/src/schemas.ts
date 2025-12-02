import assert from 'node:assert';
import { z, ZodType, RefinementCtx } from 'zod';
import moment from 'moment';
import dateMath from 'datemath-parser';
import { isFunction } from './functions.js';
import { isString, startsWith } from './strings.js';
import { isInteger, toInteger } from './numbers.js';
import { isValidDate } from './dates.js';

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

export class SchemaValidator<T = any> {
    schema: Schema<T>;
    zodSchema: ZodType<T>;
    // convict pattern:
    // const config = convict(inputSchema); convict() == z.object()
    // config.load(inputConfig);
    // config.validate(validateOptions); validate() == parse()
    // const jobProperties = config.getProperties(); equivalent to the object returned by parse()

    // parse a schema - validate that object meets schema criteria. returns the type we need.
    // parse or safeParse?
    // Important: need to handle args and env

    constructor(
        schema: Schema<T>,
        parentKey: PropertyKey,
        extraFormats: Format[] = []
    ) {
        this.schema = schema;
        this.zodSchema = this._convictSchemaToZod(schema, parentKey, extraFormats);
    }

    validate(config: any) {
        return this.zodSchema.parse(config);
    }

    static getSchemaJSON(schema: ZodType) {
        return z.toJSONSchema(schema);
    }

    /**
     * convert a convict schema to zod schema
     *
     * @param convictSchema 
     * @param parentKey 
     * @param extraFormats 
     * @returns 
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
        // console.log('@@@@ SchemaValidator.formats: ', SchemaValidator.formats);

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
                // console.log(`@@@@ key: `, key);

                fields[key] = this._convictSchemaToZod(
                    value as Schema<T>,
                    `${parentKey.toString()}.${key}`,
                    extraFormats
                );
                defaults[key] = fields[key].parse({});
            }
        }
        // console.log(`@@@@ fields for ${parentKey.toString()}: `, fields);
        // console.log(`@@@@ defaults for ${parentKey.toString()}: `, defaults);

        return z.looseObject(fields)
            .default(defaults) as z.ZodType<T>;
    }

    _convictSchemaObjToZod(
        key: PropertyKey,
        schemaObj: SchemaObj<T>,
        extraFormats: Format[]
    ) {
        let type: ZodType;
        console.log('@@@@ convictSchemaObjToZod key: ', key);

        if (schemaObj.format === undefined) {
            // default format is the typeof the default value
            const defaultType = Object.prototype.toString.call(schemaObj.default);
            // console.log('@@@@ defaultType: ', defaultType);

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

        // if (schemaObj.doc) {
        //     console.log('@@@@ key: ', key);
        //     console.log('@@@@ parentKey: ', parentKey);

        //     const combinedKey = `${parentKey.toString()}.${key.toString()}`;
        //     console.log('@@@@ combinedKey: ', combinedKey);

        //     type = type.meta({
        //         id: combinedKey,
        //         title: combinedKey,
        //         description: schemaObj.doc
        //     });
        // }

        if (schemaObj.arg) {
            // handle in parse step?
        }
        if (schemaObj.env) {
            // handle in parse step?
        }
        if (schemaObj.sensitive) {
            // no zod equivalent
        }

        if (schemaObj.nullable) {
            type = type.nullable();
        }
        // console.log(`@@@@ type.meta for ${key.toString()}: `, type.meta());

        return type;
    }

    _convictFormatToZod(
        key: PropertyKey,
        schemaObj: SchemaObj<T>,
        convictFormatValue: ConvictFormat,
        extraFormats: Format[]
    ): ZodType {
        console.log(`@@@@ convictFormat for ${key.toString()} : `, convictFormatValue);
        // console.log(`@@@@ extraFormats : `, extraFormats);
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
                    .number()
                    .int()
                    .min(1)
                    .max(65535);
                break;
            case 'nat':
            case 'timestamp':
            case 'positive_int':
            case 'duration':
                // we can't do any checks before initial value is coerced
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
            case ((extraFormats && extraFormats.length > 0) ? convictFormatValue : undefined):
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
            console.log('@@@@ default: ', schemaObj.default);

            // validate that the default fits the format
            // try {
            //     type.parse(schemaObj.default);
            // } catch (err) {
            //     console.log('@@@@ default parse failed');
            //     throw err;
            // }

            if (schemaObj.default === undefined) {
                console.log('@@@@ default makes field optional');

                type = type.optional().default(undefined);
            } else if (schemaObj.default === '') {
                console.log('@@@@ default makes field optional');

                type = type.optional().default('');
            } else if (schemaObj.default === null) {
                console.log('@@@@ default makes field optional');

                type = type.optional().default(null);
            } else {
                type = type.default(schemaObj.default);
            }
        }

        const customFormat = getCustomFormat(convictFormatValue);
        // console.log('@@@@ customFormat: ', customFormat);

        const finalFormat: ConvictFormat = customFormat ?? convictFormatValue;
        // console.log('@@@@ finalFormat: ', finalFormat);

        if (isOfTypeFormat(finalFormat)) {
            if (finalFormat.coerce && finalFormat.validate) {
                // console.log('@@@@ coerce fn');

                return type.transform((val, ctx) => {
                    try {
                        let finalVal = val;
                        if (finalFormat.coerce) {
                            finalVal = finalFormat.coerce(val);
                        }

                        // FIXME add tests for this
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
                // console.log('@@@@ validate fn only');

                return type.superRefine((val, ctx) => {
                    try {
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
                    console.log('@@@@ args: ', args);
                    if (args === null || args === undefined) {
                        val = schemaObj.default;
                        // with convict inline functions, if the default value is 'null'
                        // or 'undefined' then it's considered a valid value for the
                        // field and the format Fn is skipped
                        console.log('@@@@ val after args not defined: ', val);

                        if (val === null || val === undefined) {
                            console.log('@@@@ validation fn skipped: ', val);
                            return;
                        }
                    } else {
                        val = args;
                    }
                    console.log('@@@@ val before validation: ', val);
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

        // console.log('@@@@ type after function parts: ', type);

        // if (Object.hasOwn(schemaObj, 'default')) {
        //     console.log('@@@@ default: ', schemaObj.default);

        //     if (schemaObj.default === undefined) {
        //         console.log('@@@@ default makes field optional');

        //         type = type.optional().default(undefined);
        //     } else if (schemaObj.default === '') {
        //         // console.log('@@@@ default makes field optional');

        //         type = type.optional().default('');
        //     } else if (schemaObj.default === null) {
        //         // console.log('@@@@ default makes field optional');

        //         type = type.optional().default(null);
        //     } else {
        //         type = type.default(schemaObj.default);
        //     }
        // }

        // console.log('@@@@ type after default added: ', type);
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
