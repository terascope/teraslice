import { Signale } from 'signale';

export default new Signale({
    logLevel: 'info',
    stream: process.stderr,
    types: {
        debug: {
            color: 'cyan'
        },
        pending: {
            badge: '*'
        }
    }
} as any);
