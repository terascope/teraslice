import { BaseSchema } from '../../../../src/index.js';

export class AssetProcessorSchema extends BaseSchema<any, any> {
    build(): Record<string, any> {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
            test_flush: {
                default: false,
                doc: 'Test flushing',
                format: 'Boolean',
            },
            isAssetProcessorSchema: {
                default: true,
                doc: 'I exist for testing',
                format: 'Boolean'
            }
        };
    }
}
