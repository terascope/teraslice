import * as es from 'elasticsearch';
import { ELASTICSEARCH_HOST } from './config';

export function makeClient(): es.Client {
    return new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error',
        apiVersion: '6.5'
    });
}
