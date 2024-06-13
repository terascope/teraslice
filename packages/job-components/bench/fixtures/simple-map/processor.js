import { MapProcessor } from '../../../dist/src/index.js';

export default class SimpleMap extends MapProcessor {
    map(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}
