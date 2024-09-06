import { isTest } from '@terascope/utils';
import signalePkg from 'signale';

const { Signale } = signalePkg;

export default new Signale({
    logLevel: isTest ? 'error' : 'info',
    stream: process.stderr,
    types: {
        debug: {
            color: 'cyan',
        } as any,
        pending: {
            badge: '*',
        } as any,
    },
});
