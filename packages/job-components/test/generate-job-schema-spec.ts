import 'jest-extended';
import { generateJobJSONSchema, TestContext } from '../src/index.js';

describe('generateJobJSONSchema', () => {
    const context = new TestContext('teraslice-operations');
    const schema = generateJobJSONSchema(context);

    it('returns a draft-07 schema describing a job object', () => {
        expect(schema.$schema).toEqual('http://json-schema.org/draft-07/schema#');
        expect(schema.title).toEqual('Teraslice Job');
        expect(schema.type).toEqual('object');
        expect(schema.additionalProperties).toBe(false);
        expect(schema.required).toIncludeAllMembers(['name', 'operations']);
    });

    it('maps enum, string, and number formats from the job schema', () => {
        expect(schema.properties.lifecycle.enum).toEqual(['once', 'persistent']);
        expect(schema.properties.name).toMatchObject({ type: 'string', minLength: 1 });
        expect(schema.properties.workers).toMatchObject({ type: 'integer', minimum: 1 });
        expect(schema.properties.max_retries).toMatchObject({ type: 'integer', minimum: 0 });
    });

    it('carries the doc string into the description', () => {
        expect(schema.properties.lifecycle.description).toBeString();
        expect(schema.properties.lifecycle.description.length).toBeGreaterThan(0);
    });

    it('describes operations and apis, requiring _op and _name', () => {
        expect(schema.properties.operations).toMatchObject({
            type: 'array',
            minItems: 2,
            items: { $ref: '#/definitions/operation' },
        });
        expect(schema.definitions.operation.required).toEqual(['_op']);
        expect(schema.definitions.operation.additionalProperties).toBe(true);
        expect(schema.definitions.api.required).toEqual(['_name']);
        expect(schema.definitions.api.additionalProperties).toBe(true);
    });

    it('allows an inline $schema key', () => {
        expect(schema.properties.$schema).toMatchObject({ type: 'string' });
    });

    it('allows the teraslice-cli __metadata field', () => {
        expect(schema.properties.__metadata).toMatchObject({
            type: 'object',
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
        });
    });

    it('includes kubernetes fields only on kubernetes clusters', () => {
        expect(schema.properties.resources_requests_cpu).toBeUndefined();

        const k8sContext = new TestContext('teraslice-operations');
        k8sContext.sysconfig.teraslice.cluster_manager_type = 'kubernetesV2';
        const k8sSchema = generateJobJSONSchema(k8sContext);

        expect(k8sSchema.properties.resources_requests_cpu).toMatchObject({ type: 'number' });
    });
});
