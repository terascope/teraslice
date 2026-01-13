import { BaseSchema } from '@terascope/job-components';
import { SimpleAPIConfig } from './interfaces';

export default class Schema extends BaseSchema<SimpleAPIConfig> {
    build(): Record<string, any> {
        return {};
    }
}
