import { DelayConfig } from './interfaces.js';
import { BaseSchema } from '../../operations/index.js';

export default class Schema extends BaseSchema<DelayConfig> {
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
