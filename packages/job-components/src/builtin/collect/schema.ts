import { CollectConfig } from './interfaces';
import { ConvictSchema } from '../../operations';

export default class Schema extends ConvictSchema<CollectConfig> {
    build() {
        return {
            size: {
                default: null,
                doc: 'The target count records to collect before resolving',
                format: 'Number'
            },
            wait: {
                default: null,
                doc: 'Maximum time to wait before resolving the currently queued records',
                format: 'Number'
            },
        };
    }
}
