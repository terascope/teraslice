// FIXME i'm doing something stupid or got is acting very weird in typescript -
// if i comment the import out from the main index it allows completely different imports
import {
    calculateRetryDelay, create, got, isResponseOk,
    parseBody, parseLinkHeader
} from 'got';

const httpClient = got;

const httpClientHelpers = {
    calculateRetryDelay,
    createClient: create,
    isResponseOk,
    parseBody,
    parseLinkHeader,
};

export {
    httpClient,
    httpClientHelpers
};
