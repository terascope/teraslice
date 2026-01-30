import 'jest-extended';
import ElasticsearchConnector from '../../src/connectors/elasticsearch-next.js';

describe('elasticsearch-next', () => {
    describe('validate_config', () => {
        it('should throw if auth and username are both set', () => {
            const config = {
                auth: { username: 'user', password: 'pass' },
                username: 'user',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('"auth" can not be set at the same time as "username" or "password".');
        });

        it('should throw if auth and password are both set', () => {
            const config = {
                auth: { username: 'user', password: 'pass' },
                password: 'pass',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('"auth" can not be set at the same time as "username" or "password".');
        });

        it('should throw if username is set without password', () => {
            const config = {
                username: 'user',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('Both "username" and "password" must be provided when one is set');
        });

        it('should throw if password is set without username', () => {
            const config = {
                password: 'pass',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('Both "username" and "password" must be provided when one is set');
        });

        it('should not throw with valid username and password', () => {
            const config = {
                username: 'user',
                password: 'pass',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });

        it('should not throw with valid auth object', () => {
            const config = {
                auth: { username: 'user', password: 'pass' },
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });

        it('should not throw with no auth fields set', () => {
            const config = {} as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });
    });
});
