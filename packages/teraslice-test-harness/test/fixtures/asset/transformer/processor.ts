import { SimpleAPI } from '../simple-api/interfaces';
import { MapProcessor, DataEntity } from '@terascope/job-components';
import { TransformerConfig } from './interfaces';

export default class Transformer extends MapProcessor<TransformerConfig> {
    map(data: DataEntity) {
        const api = this.simpleAPI();
        if (api != null) {
            api.sub();
        }
        const { action, key } = this.opConfig;
        if (action === 'set') {
            const { setValue } = this.opConfig;
            data[key] = setValue;
        } else if (action === 'drop') {
            delete data[key];
        } else if (action === 'inc') {
            const { incBy = 1 } = this.opConfig;
            if (data[key] == null) {
                data[key] = incBy;
            } else {
                data[key] += incBy;
            }
        }
        return data;
    }

    simpleAPI() {
        try {
            return this.getAPI('simple-api') as SimpleAPI;
        } catch (err) {
            return null;
        }
    }
}
