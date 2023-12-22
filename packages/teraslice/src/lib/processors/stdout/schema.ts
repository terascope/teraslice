import { ConvictSchema } from '@terascope/job-components';
import { StdoutConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<StdoutConfig> {
    build() {
        return {
            limit: {
                doc: 'Specify a number > 0 to limit the number of results printed to the console log.'
                    + 'This prints results from the beginning of the result set.',
                default: 0,
                format: 'nat'
            }
        };
    }
}
