import { ConvictSchema } from '@terascope/job-components';
import { SaveFileConfig } from './interfaces';

export default class Schema extends ConvictSchema<SaveFileConfig> {
    build() {
        return {
            file_path: {
                doc: 'Specify a number > 0 to limit the number of results printed to the console log.'
                + 'This prints results from the beginning of the result set.',
                default: __dirname
            }
        };
    }
}
