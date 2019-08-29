import { ConvictSchema } from '@terascope/job-components';
import { SimpleAPIConfig } from './interfaces';

export default class Schema extends ConvictSchema<SimpleAPIConfig> {
    build() {
        return {};
    }
}
