import { DelayConfig } from './interfaces';
import { ConvictSchema } from '../../operations';

export default class Schema extends ConvictSchema<DelayConfig> {
    build() {
        return {
            ms: {
                default: 100,
                doc: 'Time delay in milliseconds',
                format: 'Number'
            }
        };
    }
}
