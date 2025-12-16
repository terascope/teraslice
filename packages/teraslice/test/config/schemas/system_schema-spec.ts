import { SchemaValidator } from '@terascope/core-utils';
import { config_schema } from '../../../src/lib/config/schemas/system.js';

describe('system_schema', () => {
    const schema = config_schema().schema.teraslice;

    function checkValidation(config: Record<string, any>) {
        try {
            const validator = new SchemaValidator<any>(schema, 'teraslice');

            return validator.validate(config);
        } catch (err) {
            return err.message;
        }
    }

    it('schema has defaults', () => {
        expect(schema.shutdown_timeout).toBeDefined();
        expect(schema.hostname).toBeDefined();
        expect(schema).toBeDefined();
        expect(schema.port.default).toEqual(5678);
        expect(schema.name.default).toEqual('teracluster');
        expect(schema.state.default).toEqual({ connection: 'default' });
    });

    it('assets_directory is optional but requires a string', () => {
        expect(checkValidation({ assets_directory: 234 })).toContain(
            'Invalid parameter assets_directory, it must either be a string or an array of strings'
        );
    });
});
