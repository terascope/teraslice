import { SimpleAPIConfig } from './interfaces';
import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema<SimpleAPIConfig> {
    build() {
        return {};
    }
}
