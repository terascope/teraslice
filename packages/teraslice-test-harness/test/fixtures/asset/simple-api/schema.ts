import { ConvictSchema, AnyObject } from '@terascope/job-components';
import { SimpleAPIConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SimpleAPIConfig> {
    build(): AnyObject {
        return {};
    }
}
