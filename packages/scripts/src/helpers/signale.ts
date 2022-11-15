import { isTest } from '@terascope/utils';
import signale from 'signale';

// look into defaults
const { Signale } = signale;

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
