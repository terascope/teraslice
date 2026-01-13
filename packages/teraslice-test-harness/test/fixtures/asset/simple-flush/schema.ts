import { BaseSchema } from '@terascope/job-components';
import { FlusherConfig } from './interfaces';

export default class Schema extends BaseSchema<FlusherConfig> {
    build(): Record<string, any> {
        return {
            someSetting: {
                default: 'hello world'
            }
        };
    }
}
