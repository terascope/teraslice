
import { ConvictSchema } from '@terascope/job-components';
import { FlusherConfig } from './interfaces';

export default class Schema extends ConvictSchema<FlusherConfig> {
    build() {
        return {
            someSetting: {
                default: 'hello world'
            }
        };
    }
}
