import * as es from 'elasticsearch';
import { ELASTICSEARCH_HOST } from './config';

// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(10000);

export function makeClient(): es.Client {
    return new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error',
        apiVersion: '6.5'
    });
}
