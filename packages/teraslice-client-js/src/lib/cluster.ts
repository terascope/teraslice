
import { startsWith } from '@terascope/job-components';
import util from 'util';
import Client from './client';
import { TxtType } from '../interfaces';

// TODO: fix this
function _deprecateSlicerName(fn: () => Promise<any>) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

export default class Cluster extends Client {
    constructor(config:any) {
        super(config);
        this.slicers = _deprecateSlicerName(this.slicers);
    }

    async info() {
        return this.get('/');
    }

    async state() {
        return this.get('/cluster/state');
    }

    async stats() {
        return this.get('/cluster/stats');
    }

    async slicers() {
        return this.get('/cluster/slicers');
    }

    async controllers() {
        return this.get('/cluster/controllers');
    }

    async txt(type: TxtType) {
        const validTypes = ['assets', 'slicers', 'ex', 'jobs', 'nodes', 'workers'];
        const isValid = validTypes.some((validType) => startsWith(type, validType));
        if (!isValid) {
            const error = new Error(`"${type}" is not a valid type. Must be one of ${JSON.stringify(validTypes)}`);
            return Promise.reject(error);
        }
        return this.get(`/txt/${type}`, { json: false });
    }
}
