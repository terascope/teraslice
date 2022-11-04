import { v4 as uuidv4 } from 'uuid';
import { Slicer } from '@terascope/job-components';

export default class ExampleSlicer extends Slicer {
    async slice() {
        return {
            id: uuidv4(),
            fetchFrom: 'https://httpstat.us/200'
        };
    }
}
