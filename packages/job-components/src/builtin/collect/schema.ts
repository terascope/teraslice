import { CollectConfig } from './interfaces.js';
import { ConvictSchema } from '../../operations/index.js';

export default class Schema extends ConvictSchema<CollectConfig> {
    build(): Record<string, any> {
        return {
            size: {
                default: null,
                doc: 'The target count records to collect before resolving',
                format: 'Number'
            },
            wait: {
                default: null,
                doc: 'Maximum time to wait before resolving the currently queued records',
                format: 'duration'
            },
        };
    }
}
