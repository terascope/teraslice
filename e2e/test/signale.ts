import signale from 'signale';

export default new signale.Signale({
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
