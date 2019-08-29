import 'jest-extended';
import { TSError } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import { formatError } from '../src/manager/utils';

// TODO: add tests for no stack traces

describe('Manager Utils', () => {
    describe('formatError', () => {
        it('should handle a regular error', () => {
            const input = new Error('Uh oh');
            const err = formatError(false)(input);

            expect(err).toHaveProperty('extensions');
            expect(err.stack).toEqual(input.stack);
            expect(err.message).toEqual(input.message);
        });

        it('should handle a TSError error', () => {
            const input = new TSError('Uh oh');
            const err = formatError(false)(input);

            expect(err).toHaveProperty('extensions');
            expect(err.stack).toBeDefined();
            expect(err.message).toEqual(input.message);
        });

        it('if removeUserStack is true, and status code above 400 below 500 remove stack', () => {
            const input1 = new TSError('Uh oh', { statusCode: 400 });
            const err1 = formatError(true)(input1);

            const input2 = new TSError('Uh oh', { statusCode: 500 });
            const err2 = formatError(true)(input2);


            expect(err1).toHaveProperty('extensions');
            expect(err1.stack).toBeUndefined();
            expect(err1.message).toEqual(input1.message);

            expect(err2).toHaveProperty('extensions');
            expect(err2.stack).toBeDefined();
            expect(err2.message).toEqual(input2.message);
        });

        it('should handle a TSError error', () => {
            const input = new TSError('Uh oh');
            const err = formatError(false)(input);

            expect(err).toHaveProperty('extensions');
            expect(err.stack).toBeDefined();
            expect(err.message).toEqual(input.message);
        });

        it('should handle a validation error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 422,
            });

            const err = formatError(false)(input);

            expect(err).toBeInstanceOf(apollo.ValidationError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle a authentication error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 401,
            });

            const err = formatError(false)(input);

            expect(err).toBeInstanceOf(apollo.AuthenticationError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle a forbidden error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 403,
            });

            const err = formatError(false)(input);

            expect(err).toBeInstanceOf(apollo.ForbiddenError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle any other 400 error', () => {
            const input = new TSError('Uh oh', {
                statusCode: 411,
            });

            const err = formatError(false)(input);

            expect(err).toBeInstanceOf(apollo.UserInputError);
            expect(err.message).toEqual(input.message);
        });

        it('should handle an apollo error', () => {
            const input = new apollo.ApolloError('Uh oh');

            const err = formatError(false)(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo user input error', () => {
            const input = new apollo.UserInputError('Uh oh');

            const err = formatError(false)(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo validation error', () => {
            const input = new apollo.ValidationError('Uh oh');

            const err = formatError(false)(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo authentication error', () => {
            const input = new apollo.AuthenticationError('Uh oh');

            const err = formatError(false)(input);

            expect(err).toBe(input);
        });

        it('should handle an apollo forbidden error', () => {
            const input = new apollo.ForbiddenError('Uh oh');

            const err = formatError(false)(input);

            expect(err).toBe(input);
        });

        it('stack should be undefined it set to true with an apollo error', () => {
            const input = new apollo.UserInputError('Uh oh');
            input.extensions.exception = { stack: input.stack };
            const err = formatError(true)(input);

            expect(err).toHaveProperty('extensions');
            expect(err.extensions.exception.stack).not.toBeDefined();
            expect(err.message).toEqual(input.message);
        });
    });
});
