import 'jest-extended';
import { DataWindow, DataEntity, fastCloneDeep } from '@terascope/utils';
import {
    handleProcessorFn,
} from '../../src/execution-context/utils';

describe('Execution Context Utils', () => {
    describe('handleProcessorFn', () => {
        let handleFn: (input: any) => Promise<any>;

        describe('when given an empty window', () => {
            let results: any;

            beforeEach(async () => {
                handleFn = handleProcessorFn({
                    async handle() {
                        return DataWindow.make([]);
                    }
                });

                results = await handleFn(DataWindow.make([]));
            });

            it('should return the DataEntity results', () => {
                expect(results).toEqual([]);
                expect(DataEntity.isArray(results)).toBeTrue();
            });
        });

        describe('when handling the fn returns an array of DataEntities', () => {
            beforeEach(() => {
                handleFn = handleProcessorFn({
                    async handle(input): Promise<any> {
                        return DataEntity.makeArray(
                            fastCloneDeep(input)
                        );
                    }
                });
            });

            describe('when given a DataWindow', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn(DataWindow.make([
                        { hi: true }
                    ]));
                });

                it('should return the DataEntity results', () => {
                    expect(results).toEqual([
                        { hi: true }
                    ]);
                    expect(DataEntity.isArray(results)).toBeTrue();
                });
            });

            describe('when given an array of one DataWindow', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn([
                        DataWindow.make([
                            { hi: true }
                        ])
                    ]);
                });

                it('should return the DataEntity results', () => {
                    expect(DataWindow.isArray(results)).toBeTrue();
                    expect(results).toBeArrayOfSize(1);
                    expect(results[0]).toEqual([
                        { hi: true }
                    ]);
                    expect(DataEntity.isArray(results[0])).toBeTrue();
                });
            });

            describe('when given an array of two DataWindows', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn([
                        DataWindow.make([
                            { hi: true }
                        ]),
                        DataWindow.make([
                            { hi: true }
                        ])
                    ]);
                });

                it('should return the DataEntity results', () => {
                    expect(DataWindow.isArray(results)).toBeTrue();
                    expect(results).toBeArrayOfSize(2);
                    expect(results[0]).toEqual([
                        { hi: true }
                    ]);
                    expect(DataEntity.isArray(results[0])).toBeTrue();
                });
            });
        });

        describe('when handling the fn returns a DataWindow', () => {
            beforeEach(() => {
                handleFn = handleProcessorFn({
                    async handle(input) {
                        return DataWindow.make(input.toArray());
                    }
                });
            });

            describe('when given a DataWindow', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn(DataWindow.make([
                        { hi: true }
                    ]));
                });

                it('should return the DataEntity results', () => {
                    expect(results).toEqual([
                        { hi: true }
                    ]);
                    expect(results).toBeInstanceOf(DataWindow);
                    expect(DataWindow.is(results)).toBeTrue();
                });
            });

            describe('when given an array of one DataWindow', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn([
                        DataWindow.make([
                            { hi: true }
                        ])
                    ]);
                });

                it('should return an array of one of DataWindow', () => {
                    expect(DataWindow.isArray(results)).toBeTrue();
                    expect(results).toBeArrayOfSize(1);
                    expect(results[0]).toEqual([
                        { hi: true }
                    ]);
                    expect(results[0]).toBeInstanceOf(DataWindow);
                });
            });

            describe('when given an array of two DataWindows', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn([
                        DataWindow.make([
                            { hi: true }
                        ]),
                        DataWindow.make([
                            { hi: true }
                        ])
                    ]);
                });

                it('should return an array of two of DataWindows', () => {
                    expect(DataWindow.isArray(results)).toBeTrue();
                    expect(results).toBeArrayOfSize(2);
                    expect(results).toEqual([
                        [
                            { hi: true }
                        ],
                        [
                            { hi: true }
                        ]
                    ]);
                });
            });
        });

        describe('when handling the fn returns an array of DataWindows', () => {
            beforeEach(() => {
                handleFn = handleProcessorFn({
                    async handle(input) {
                        return [
                            DataWindow.make(
                                input.toArray()
                            ) as any,
                            DataWindow.make(
                                input.toArray()
                                    .map((doc) => new DataEntity(doc))
                                    .map((doc) => {
                                        doc.hi = false;
                                        return doc;
                                    })
                            ),
                        ];
                    }
                });
            });

            describe('when given a DataWindow', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn(DataWindow.make([
                        { hi: true }
                    ]));
                });

                it('should return an array of one DataWindow', () => {
                    expect(results).toBeArrayOfSize(2);
                    expect(DataWindow.isArray(results)).toBeTrue();
                });
            });

            describe('when given an array of one DataWindow', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn([
                        DataWindow.make([
                            { hi: true }
                        ])
                    ]);
                });

                it('should return an array of two of DataWindows', () => {
                    expect(DataWindow.isArray(results)).toBeTrue();
                    expect(results).toBeArrayOfSize(2);
                    expect(results).toEqual([
                        [
                            { hi: true }
                        ],
                        [
                            { hi: false }
                        ],
                    ]);
                });
            });

            describe('when given an array of two DataWindows', () => {
                let results: any;

                beforeEach(async () => {
                    results = await handleFn([
                        DataWindow.make([
                            { hi: true }
                        ]),
                        DataWindow.make([
                            { hi: true }
                        ])
                    ]);
                });

                it('should return an array of four of DataWindows', () => {
                    expect(DataWindow.isArray(results)).toBeTrue();
                    expect(results).toBeArrayOfSize(4);
                    expect(results).toEqual([
                        [
                            { hi: true }
                        ],
                        [
                            { hi: false }
                        ],
                        [
                            { hi: true }
                        ],
                        [
                            { hi: false }
                        ],
                    ]);
                });
            });
        });
    });
});
