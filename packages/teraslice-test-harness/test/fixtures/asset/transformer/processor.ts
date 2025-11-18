import { MapProcessor } from '@terascope/job-components';
import { DataEntity } from '@terascope/core-utils';
import { SimpleAPI } from '../simple-api/interfaces';
import { TransformerConfig } from './interfaces';

export default class Transformer extends MapProcessor<TransformerConfig> {
    map(data: DataEntity): DataEntity {
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

    simpleAPI(): SimpleAPI | null {
        try {
            return this.getAPI('simple-api') as SimpleAPI;
        } catch (err) {
            return null;
        }
    }
}
