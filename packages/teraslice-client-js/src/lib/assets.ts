
import { TSError, isEmpty } from '@terascope/job-components';
import path from 'path';
import Client from './client';
import { QueryOptions, PostData } from '../interfaces';

export default class Assets extends Client {

    async post(data:PostData, options: QueryOptions = {}) {
        if (isEmpty(data)) throw new TSError('Asset stream must not be empty');
        return super.post('/assets', data, options);
    }

    async delete(id:string) {
        if (isEmpty(id)) throw new TSError('Asset delete requires a ID');
        return super.delete(`/assets/${id}`);
    }

    async list() {
        return super.get('/assets');
    }

    async get(name:string) {
        const pathing = path.join('/assets', name);
        return super.get(pathing);
    }

    async getAsset(name:string, version:string = '') {
        const pathing = path.join('/assets', name, version);
        return super.get(pathing);
    }
}
