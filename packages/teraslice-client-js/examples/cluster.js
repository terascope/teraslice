/* eslint-disable no-console */

import { TerasliceClient } from 'teraslice-client-js';

const client = new TerasliceClient({
    host: 'http://localhost:5678'
});

const state = await client.cluster.state();

const controllers = await client.cluster.controllers();

console.dir({ state, controllers }, { depth: 40 });
