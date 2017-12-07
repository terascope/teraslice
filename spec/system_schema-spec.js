'use strict';

const sysSchema = require('../lib/config/schemas/system');

describe('system_schema', () => {
    it('schema has defaults', () => {
        expect(sysSchema.schema.ops_directory).toBeDefined();
        expect(sysSchema.schema.shutdown_timeout).toBeDefined();
        expect(sysSchema.schema.reporter).toBeDefined();
        expect(sysSchema.schema.hostname).toBeDefined();

        const schema = sysSchema.config_schema({});

        expect(schema).toBeDefined();
        expect(schema.port.default).toEqual(5678);
        expect(schema.name.default).toEqual('teracluster');
        expect(schema.state.default).toEqual({ connection: 'default' });
    });
});
