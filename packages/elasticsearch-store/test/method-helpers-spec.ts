import { ensureNoTypeInMapping } from '../src/elasticsearch-client/method-helpers/index.js';

describe('test method helpers', () => {
    describe('->ensureNoTypeInMapping', () => {
        describe('mappings with type', () => {
            const mappingsWithType = {
                myType: {
                    _meta: {
                        foo: 'foo'
                    },
                    _all: {
                        enabled: false
                    },
                    dynamic: false,
                    properties: {
                        _context: {
                            type: 'keyword'
                        },
                        _created: {
                            type: 'date'
                        },
                        _updated: {
                            type: 'date'
                        },
                        _deleted: {
                            type: 'boolean'
                        },
                        _deleted_on: {
                            type: 'date'
                        }
                    }
                }
            };

            it('should remove myType wrapper object from mappingsWithType', () => {
                const newMappings = ensureNoTypeInMapping(mappingsWithType);
                expect(newMappings.myType).toBe(undefined);
            });

            it('should remove _all from mappingsWithType', () => {
                const newMappings = ensureNoTypeInMapping(mappingsWithType);
                expect(newMappings._all).toBe(undefined);
            });

            it('should include properties, _meta, and dynamic from mappingsWithType', () => {
                const newMappings = ensureNoTypeInMapping(mappingsWithType);
                expect(newMappings).toMatchObject({
                    _meta: {
                        foo: 'foo'
                    },
                    dynamic: false,
                    properties: {
                        _context: {
                            type: 'keyword',
                        },
                        _created: {
                            type: 'date',
                        },
                        _deleted: {
                            type: 'boolean',
                        },
                        _deleted_on: {
                            type: 'date',
                        },
                        _updated: {
                            type: 'date',
                        },
                    },
                });
            });
        });

        describe('mappings without type', () => {
            const mappingsWithoutType = {
                _meta: {
                    foo: 'foo'
                },
                _all: {
                    enabled: false
                },
                dynamic: false,
                properties: {
                    _context: {
                        type: 'keyword'
                    },
                    _created: {
                        type: 'date'
                    },
                    _updated: {
                        type: 'date'
                    },
                    _deleted: {
                        type: 'boolean'
                    },
                    _deleted_on: {
                        type: 'date'
                    }
                }
            };

            it('should remove _all from mappingsWithoutType', () => {
                const newMappings = ensureNoTypeInMapping(mappingsWithoutType);
                expect(newMappings._all).toBe(undefined);
            });

            it('should include properties, _meta, and dynamic from mappingsWithoutType', () => {
                const newMappings = ensureNoTypeInMapping(mappingsWithoutType);
                expect(newMappings).toMatchObject({
                    _meta: {
                        foo: 'foo'
                    },
                    dynamic: false,
                    properties: {
                        _context: {
                            type: 'keyword',
                        },
                        _created: {
                            type: 'date',
                        },
                        _deleted: {
                            type: 'boolean',
                        },
                        _deleted_on: {
                            type: 'date',
                        },
                        _updated: {
                            type: 'date',
                        },
                    },
                });
            });
        });
    });
});
