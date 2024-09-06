import { v4 as uuid } from 'uuid';
import { Slicer } from '@terascope/job-components';

export default class ExampleSlicer extends Slicer {
    async slice() {
        return {
            id: uuid(),
            fetchFrom: 'https://httpstat.us/200'
        };
    }
}
