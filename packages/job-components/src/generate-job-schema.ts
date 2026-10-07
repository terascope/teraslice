import { logLevels } from '@terascope/core-utils';
import { Terafoundation } from '@terascope/types';
import { jobSchema, opSchema, apiSchema } from './job-schemas.js';
import { Context } from './interfaces/index.js';

const JSON_SCHEMA_DRAFT = 'http://json-schema.org/draft-07/schema#';
const JOB_SCHEMA_ID = 'https://terascope.github.io/teraslice/schemas/teraslice-job.schema.json';

type JSONSchemaNode = Record<string, any>;

/**
 * Maps the finite set of convict format *types* to JSON Schema. Job *fields*
 * are not listed here (they are read dynamically from the schema), so adding a
 * normal field needs no change here. This only grows if core-utils introduces a
 * brand-new format type; unrecognized formats fall through to permissive.
 */
function formatToJSONSchema(format: any): JSONSchemaNode {
    if (format === Boolean) return { type: 'boolean' };
    if (format === Number) return { type: 'number' };
    if (format === String) return { type: 'string' };
    if (format === Object) return { type: 'object' };
    if (format === Array) return { type: 'array' };
    if (format === RegExp) return { type: 'string' };

    if (Array.isArray(format)) {
        return { enum: [...format] };
    }

    if (typeof format === 'function') {
        return {};
    }

    switch (format) {
        case '*':
            return {};
        case 'int':
            return { type: 'integer' };
        case 'port':
            return { type: 'integer', minimum: 1, maximum: 65535 };
        case 'nat':
            return { type: 'integer', minimum: 0 };
        case 'url':
            return { type: 'string', format: 'uri' };
        case 'email':
            return { type: 'string', format: 'email' };
        case 'ipaddress':
            return { type: 'string' };
        case 'String':
            return { type: 'string' };
        case 'Number':
            return { type: 'number' };
        case 'Boolean':
            return { type: 'boolean' };
        case 'Object':
            return { type: 'object' };
        case 'Array':
            return { type: 'array' };
        case 'RegExp':
            return { type: 'string' };
        case 'required_string':
            return { type: 'string', minLength: 1 };
        case 'optional_string':
            return { type: 'string' };
        case 'optional_date':
            return { type: ['string', 'integer'] };
        case 'elasticsearch_name':
            return { type: 'string', maxLength: 255 };
        case 'positive_int':
            return { type: 'integer', minimum: 1 };
        case 'optional_bool':
            return { type: 'boolean' };
        case 'optional_int':
            return { type: 'integer' };
        case 'duration':
            return { type: ['integer', 'string'] };
        case 'optional_duration':
            return { type: ['integer', 'string'] };
        case 'timestamp':
            return { type: 'integer', minimum: 0 };
        default:
            return {};
    }
}

function fieldToJSONSchema(field: any, override?: JSONSchemaNode): JSONSchemaNode {
    const node: JSONSchemaNode = override ? { ...override } : formatToJSONSchema(field.format);

    if (field.doc != null) {
        node.description = Array.isArray(field.doc) ? field.doc.join(' ') : String(field.doc);
    }

    if (field.deprecated) {
        node.deprecated = true;
    }

    if (field.default !== undefined) {
        node.default = field.default;
    }

    return node;
}

interface ConvertOptions {
    overrides?: Record<string, JSONSchemaNode>;
    extraRequired?: string[];
    additionalProperties?: boolean;
}

function convictSchemaToJSONSchema(
    schema: Terafoundation.Schema<any>,
    options: ConvertOptions = {}
): JSONSchemaNode {
    const { overrides = {}, extraRequired = [], additionalProperties } = options;

    const properties: Record<string, JSONSchemaNode> = {};
    const required = [...extraRequired];

    for (const [key, field] of Object.entries(schema)) {
        properties[key] = fieldToJSONSchema(field, overrides[key]);
        if (field.format === 'required_string') {
            required.push(key);
        }
    }

    const node: JSONSchemaNode = { type: 'object', properties };

    if (required.length > 0) {
        node.required = [...new Set(required)];
    }

    if (additionalProperties !== undefined) {
        node.additionalProperties = additionalProperties;
    }

    return node;
}

/**
 * Generate a draft-07 JSON Schema for a Teraslice job from the live jobSchema,
 * opSchema, and apiSchema. The schema reflects the given context, so
 * kubernetes-only fields are included only on kubernetes clusters.
 *
 * Operation- and API-specific options (what each asset adds) are not described
 * here; operations and apis allow additional properties.
 */
export function generateJobJSONSchema(context: Context): JSONSchemaNode {
    const job = jobSchema(context);

    const operationDefinition = convictSchemaToJSONSchema(opSchema, { additionalProperties: true });
    operationDefinition.description = 'A single operation (reader, processor, or sender). Options beyond these common fields depend on _op and are provided by the asset.';

    const apiDefinition = convictSchemaToJSONSchema(apiSchema, { additionalProperties: true });
    apiDefinition.description = 'A single API or Observer. Options beyond these common fields depend on _name and are provided by the asset.';

    // Overrides for fields whose convict format is a validator function and so
    // cannot be introspected into a type.
    const jobOverrides: Record<string, JSONSchemaNode> = {
        assets: {
            type: ['array', 'null'],
            items: { type: 'string' },
        },
        operations: {
            type: 'array',
            minItems: 2,
            items: { $ref: '#/definitions/operation' },
        },
        apis: {
            type: 'array',
            items: { $ref: '#/definitions/api' },
        },
        labels: {
            type: ['object', 'null'],
            additionalProperties: { type: 'string' },
        },
        env_vars: {
            type: 'object',
            additionalProperties: { type: 'string' },
        },
        log_level: {
            type: ['string', 'null'],
            enum: [...Object.keys(logLevels), null],
        },
        targets: {
            type: 'array',
            items: {
                type: 'object',
                required: ['key', 'value'],
                properties: {
                    key: { type: 'string' },
                    value: { type: 'string' },
                },
            },
        },
        external_ports: {
            type: 'array',
            items: {
                oneOf: [
                    { type: 'integer' },
                    {
                        type: 'object',
                        required: ['name', 'port'],
                        additionalProperties: false,
                        properties: {
                            name: { type: 'string' },
                            port: { type: 'integer' },
                        },
                    },
                ],
            },
        },
        volumes: {
            type: 'array',
            items: {
                type: 'object',
                required: ['name', 'path'],
                properties: {
                    name: { type: 'string' },
                    path: { type: 'string' },
                },
            },
        },
        pod_spec_override: {
            type: 'object',
        },
    };

    const root = convictSchemaToJSONSchema(job, {
        overrides: jobOverrides,
        extraRequired: ['name', 'operations'],
        additionalProperties: false,
    });

    root.properties.$schema = {
        type: 'string',
        description: 'Optional pointer to this JSON Schema.',
    };

    root.properties.__metadata = {
        type: 'object',
        description: 'Metadata written by the teraslice-cli (tjm); not part of the job definition.',
        properties: {
            cli: {
                type: 'object',
                properties: {
                    cluster: { type: 'string' },
                    version: { type: 'string' },
                    job_id: { type: 'string' },
                    updated: { type: 'string' },
                },
            },
        },
    };

    return {
        $schema: JSON_SCHEMA_DRAFT,
        $id: JOB_SCHEMA_ID,
        title: 'Teraslice Job',
        description: 'Generated from the Teraslice job, operation, and api schemas.',
        ...root,
        definitions: {
            operation: operationDefinition,
            api: apiDefinition,
        },
    };
}
