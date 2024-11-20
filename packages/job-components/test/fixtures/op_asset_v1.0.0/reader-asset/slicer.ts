import { v4 as uuidv4 } from 'uuid';
import { Slicer } from '../../../../src/index.js';

export default class VersionSlicer extends Slicer {
    async slice(): Promise<{ id: string; fetchFrom: string; version: string }> {
        return {
            id: uuidv4(),
            fetchFrom: 'https://httpstat.us/200',
            version: '1.0.0'
        };
    }
}
