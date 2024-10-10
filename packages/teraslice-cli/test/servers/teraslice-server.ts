import nock from 'nock';
import { Teraslice } from '@terascope/types';

// TODO: take note of node_version
const rootResponse: Teraslice.ApiRootResponse = {
    arch: 'x64',
    clustering_type: 'native',
    name: 'teracluster',
    node_version: 'v10.15.3',
    platform: 'darwin',
    teraslice_version: 'v0.56.3'
};

const postAssetResponse: Teraslice.AssetIDResponse = {
    asset_id: 'assset_test_id'
};

export default class TerasliceServer {
    init(): nock.Scope {
        const scope = nock('http://localhost:5678')
            .get('/v1/')
            .reply(200, rootResponse)
            .post('/v1/assets')
            .reply(201, postAssetResponse);

        return scope;
    }
}
