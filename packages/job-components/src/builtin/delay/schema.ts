import { DelayConfig } from './interfaces.js';
import { ConvictSchema } from '../../operations/index.js';

export default class Schema extends ConvictSchema<DelayConfig> {
    build(): Record<string, any> {
        return {
            ms: {
                default: 100,
                doc: 'Time delay in milliseconds',
                format: 'duration'
            }
        };
    }
}
