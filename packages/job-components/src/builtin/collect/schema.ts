import { CollectConfig } from './interfaces';
import { ConvictSchema } from '../../operations';

export default class Schema extends ConvictSchema<CollectConfig> {
    build() {
        return {
            wait: {
                default: null,
                doc: 'Maximum time to wait before resolving the currently queued records',
                format: 'Number'
            },
            size: {
                default: null,
                doc: 'The target records to batch before resolving',
                format: 'Number'
            }
        };
    }
}
