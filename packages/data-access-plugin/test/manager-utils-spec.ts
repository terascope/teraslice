import 'jest-extended';
import { TSError } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import { formatError } from '../src/manager/utils';

describe('Manager Utils', () => {
    describe('formatError', () => {
        it('should handle a regular error', () => {
            const input = new Error('Uh oh');
            const err = formatError(input);

            expect(err).toHaveProperty('extensions');
            expect(err.message).toEqual(input.message);
        });

        it('should handle a TSError error', () => {
            const input = new TSError('Uh oh');
            const err = formatError(input);

            expect(err).toHaveProperty('extensions');
            expect(err.message).toEqual(input.message);
        });

        it('should handle a validation error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 422,
            });

            const err = formatError(input);

            expect(err).toBeInstanceOf(apollo.ValidationError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle a authentication error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 401,
            });

            const err = formatError(input);

            expect(err).toBeInstanceOf(apollo.AuthenticationError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle a forbidden error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 403,
            });

            const err = formatError(input);

            expect(err).toBeInstanceOf(apollo.ForbiddenError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle any other 400 error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 411,
            });

            const err = formatError(input);

            expect(err).toBeInstanceOf(apollo.UserInputError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle an apollo error', () => {
            const input = new apollo.ApolloError('Uh oh');

            const err = formatError(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo user input error', () => {
            const input = new apollo.UserInputError('Uh oh');

            const err = formatError(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo validation error', () => {
            const input = new apollo.ValidationError('Uh oh');

            const err = formatError(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo authentication error', () => {
            const input = new apollo.AuthenticationError('Uh oh');

            const err = formatError(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo forbidden error', () => {
            const input = new apollo.ForbiddenError('Uh oh');

            const err = formatError(input);

            expect(err).toBe(input);
        });
    });
});
