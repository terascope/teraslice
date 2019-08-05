import { Signale } from 'signale';

export default new Signale({
    // @ts-ignore because the types are wrong
    logLevel: 'info',
    stream: process.stderr,
    types: {
        log: {
            stream: [process.stdout],
        },
        debug: {
            color: 'cyan',
        },
        pending: {
            badge: '*',
        },
    },
});
