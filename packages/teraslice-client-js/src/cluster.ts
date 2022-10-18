import { startsWith } from '@terascope/job-components';
import util from 'util';
import autoBind from 'auto-bind';
import Client from './client.js';
import {
    TxtType,
    RootResponse,
    ClusterState,
    ClusterStats,
    ControllerState
} from './interfaces.js';

function _deprecateSlicerName(fn: () => Promise<ControllerState>) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

export default class Cluster extends Client {
    constructor(config: Record<string, any>) {
        super(config);
        this.slicers = _deprecateSlicerName(this.slicers);
        autoBind(this);
    }

    async info(): Promise<RootResponse> {
        return this.get('/');
    }

    async state(): Promise<ClusterState> {
        return this.get('/cluster/state');
    }

    async stats(): Promise<ClusterStats> {
        return this.get('/cluster/stats');
    }

    async slicers(): Promise<ControllerState> {
        return this.get('/cluster/slicers');
    }

    async controllers(): Promise<ControllerState> {
        return this.get('/cluster/controllers');
    }

    async txt(type: TxtType): Promise<string> {
        const validTypes = ['assets', 'slicers', 'ex', 'jobs', 'nodes', 'workers'];
        const isValid = validTypes.some((validType) => startsWith(type, validType));
        if (!isValid) {
            const error = new Error(`"${type}" is not a valid type. Must be one of ${JSON.stringify(validTypes)}`);
            return Promise.reject(error);
        }
        return this.get(`/txt/${type}`, { responseType: 'text' });
    }
}
