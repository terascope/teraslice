import { ConvictSchema } from '../../../../src/index.js';

export class AssetSchemaAPI extends ConvictSchema<any, any> {
    build(): Record<string, any> {
        return {
            'new-asset-example': {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            }
        };
    }
}
