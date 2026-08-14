import { BaseSchema } from '@terascope/job-components';
import { SimpleAPIConfig } from './interfaces.js';

export default class Schema extends BaseSchema<SimpleAPIConfig> {
    build(): Record<string, any> {
        return {};
    }
}
