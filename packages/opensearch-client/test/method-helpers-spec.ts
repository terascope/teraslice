import { ensureNoTypeInMapping } from '../src/client/method-helpers/index.js';

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

            const newMappings = ensureNoTypeInMapping(mappingsWithType);

            it('should remove myType wrapper object from mappingsWithType', () => {
                expect(newMappings.myType).toBe(undefined);
            });

            it('should remove _all from mappingsWithType', () => {
                expect(newMappings._all).toBe(undefined);
            });

            it('should include properties, _meta, and dynamic from mappingsWithType', () => {
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

            const newMappings = ensureNoTypeInMapping(mappingsWithoutType);

            it('should remove _all from mappingsWithoutType', () => {
                expect(newMappings._all).toBe(undefined);
            });

            it('should include properties, _meta, and dynamic from mappingsWithoutType', () => {
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
