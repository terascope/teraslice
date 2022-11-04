import { FilterProcessor } from '@terascope/job-components';
export default class ExampleFilter extends FilterProcessor {
    filter(data) {
        return data.statusCode < 400;
    }
}
