import { ConvictSchema, AnyObject } from '@terascope/job-components';
import { FlusherConfig } from './interfaces';

export default class Schema extends ConvictSchema<FlusherConfig> {
    build(): AnyObject {
        return {
            someSetting: {
                default: 'hello world'
            }
        };
    }
}
