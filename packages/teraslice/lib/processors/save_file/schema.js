import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema {
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
