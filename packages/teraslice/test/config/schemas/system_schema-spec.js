import convict from 'convict';
// load any convict schema
import ('@terascope/job-components');
import sysSchema from '../../../lib/config/schemas/system';

describe('system_schema', () => {
    const schema = sysSchema.config_schema({}).teraslice;

    function checkValidation(config) {
        try {
            const validator = convict(schema);
            validator.load(config);
            validator.validate();
            return validator.getProperties();
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
        expect(checkValidation({ assets_directory: 234 })).toEqual(
            'assets_directory: Invalid parameter assets_directory, it must either be a string or an array of strings: value was 234'
        );
    });
});
