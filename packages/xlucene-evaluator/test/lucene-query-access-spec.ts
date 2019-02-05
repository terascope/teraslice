import 'jest-extended';
import { LuceneQueryAccess } from '../src';

describe('LuceneQueryAccess', () => {
    describe('when constructed without exclude', () => {
        it('should set an empty array', () => {
            const queryAccess = new LuceneQueryAccess({});

            expect(queryAccess.exclude).toBeArrayOfSize(0);
        });
    });

    describe('when constructed with exclusive fields', () => {
        const queryAccess = new LuceneQueryAccess({
            exclude: [
                'bar',
                'moo',
                'baa.maa',
                'a.b',
            ]
        });

        describe('when passed queries with foo in field', () => {
            it('should return the input query', () => {
                const query = 'foo:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with bar in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'bar:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field bar is restricted');
            });

            it('should throw when input query is restricted with nested fields', () => {
                const query = 'bar.hello:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field bar.hello is restricted');
            });
        });

        describe('when passed queries with moo in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'moo:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field moo is restricted');
            });
        });

        describe('when passed queries with a nested baa.maa field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'baa.maa:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field baa.maa is restricted');
            });
        });

        describe('when passed queries with baa.chaa field', () => {
            it('should return the input query', () => {
                const query = 'baa.chaa:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with a nested a.b.c field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'a.b.c:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field a.b.c is restricted');
            });
        });

        describe('when passed queries with a.c.b field', () => {
            it('should return the input query', () => {
                const query = 'a.c.b:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });
    });

    describe('when constructed with include fields', () => {
        const queryAccess = new LuceneQueryAccess({
            include: [
                'bar'
            ]
        });

        it('should throw if field is not in the include list', () => {
            const query = 'hello:world';

            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should throw if field is not in the include list', () => {
            const query = 'hello:world AND bar:foo';

            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should allow field listed in the include list', () => {
            const query = 'bar:foo';

            expect(queryAccess.restrict(query)).toEqual(query);
        });
    });
});
