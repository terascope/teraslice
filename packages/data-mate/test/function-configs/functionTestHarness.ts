import 'jest-extended';
import {
    bigIntToJSON, hasOwn, isBigInt, isObjectEntity
} from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    functionAdapter,
    dataFrameAdapter,
    FunctionDefinitionConfig,
    DataFrame,
    isFieldTransform,
    isFieldValidation,
    Column,
    FunctionDefinitionExample,
    getDataTypeFieldAndChildren,
} from '../../src';

/**
 * This tests a function config
*/
export function functionTestHarness<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>,
    expectedName: string,
    cases: readonly FunctionDefinitionExample<T>[] = [],
): void {
    describe(fnDef.name, () => {
        it('should have the correct name in the registry', () => {
            expect(fnDef.name).toEqual(expectedName);
        });

        type Case = [
            unknown, T, FunctionDefinitionExample<T>
        ];
        const successCases: Case[] = cases.concat(fnDef.examples ?? [])
            .filter((c) => !c.fails)
            .map((c) => (
                [c.input, c.args, c]
            ));
        const failureCases: Case[] = cases.concat(fnDef.examples ?? [])
            .filter((c) => c.fails === true)
            .map((c) => (
                [c.input, c.args, c]
            ));

        if (!successCases.length) return;

        describe('when using the function adapter', () => {
            test.each(successCases)('should handle the input %p with args %p', (input, _a, testCase) => {
                if (isFieldTransform(fnDef) || isFieldValidation(fnDef)) {
                    expect(serializeBigIntegers(
                        functionAdapter(fnDef, {
                            args: testCase.args,
                            field: testCase.field,
                            config: testCase.config
                        }).column([input])
                    )).toEqual([testCase.output]);
                } else {
                    verifyObjectEntity(input);
                    expect(functionAdapter(fnDef, {
                        args: testCase.args,
                        field: testCase.field,
                        config: testCase.config
                    }).rows([input])).toEqual([testCase.output]);
                }
            });

            if (!failureCases.length) return;
            test.each(failureCases)('should throw if given the input %p with args %p', (input, _a, testCase) => {
                if (isFieldTransform(fnDef) || isFieldValidation(fnDef)) {
                    expect(() => {
                        functionAdapter(fnDef, {
                            args: testCase.args,
                            field: testCase.field,
                            config: testCase.config
                        }).column([input]);
                    }).toThrowError(
                        testCase.output ? String(testCase.output) : undefined
                    );
                } else {
                    verifyObjectEntity(input);
                    expect(() => {
                        functionAdapter(fnDef, {
                            args: testCase.args,
                            field: testCase.field,
                            config: testCase.config
                        }).rows([input]);
                    }).toThrowError(
                        testCase.output ? String(testCase.output) : undefined
                    );
                }
            });
        });

        describe('when using the data frame adapter', () => {
            test.each(successCases)('should handle the input %p with args %p', (input, _a, testCase) => {
                if (isFieldTransform(fnDef) || isFieldValidation(fnDef)) {
                    const fieldAndChildren = getDataTypeFieldAndChildren(
                        testCase.config, testCase.field
                    );
                    expect(fieldAndChildren).not.toBeNil();
                    expect(testCase.field).toBeString();
                    const column = Column.fromJSON(
                        testCase.field!,
                        fieldAndChildren!.field_config,
                        [input],
                        testCase.config.version,
                        fieldAndChildren!.child_config,
                    );

                    const outputColumn = dataFrameAdapter(fnDef, {
                        args: testCase.args,
                        field: testCase.field,
                    }).column(column);

                    if (outputColumn.config.type === FieldType.Date) {
                        // we need to make sure the outputted date
                        // is the same as the function adapter
                        expect(outputColumn.vector.toArray()).toEqual(
                            [testCase.output ?? undefined]
                        );
                    } else {
                        expect(outputColumn.toJSON()).toEqual(
                            [testCase.output ?? undefined]
                        );
                    }
                } else {
                    verifyObjectEntity(input);

                    const frame = DataFrame.fromJSON(
                        testCase.config,
                        [input],
                    );

                    const outputFrame = dataFrameAdapter(fnDef, {
                        args: testCase.args,
                        field: testCase.field,
                    }).frame(frame);

                    expect(outputFrame.toJSON()).toEqual([testCase.output ?? undefined]);
                }
            });

            if (!failureCases.length) return;

            test.each(failureCases)('should throw if given the input %p with args %p', (input, _a, testCase) => {
                if (isFieldTransform(fnDef) || isFieldValidation(fnDef)) {
                    const fieldAndChildren = getDataTypeFieldAndChildren(
                        testCase.config, testCase.field
                    );
                    expect(fieldAndChildren).not.toBeNil();
                    expect(testCase.field).toBeString();
                    const column = Column.fromJSON(
                        testCase.field!,
                        fieldAndChildren!.field_config,
                        [input],
                        testCase.config.version,
                        fieldAndChildren!.child_config,
                    );

                    expect(() => {
                        dataFrameAdapter(fnDef, {
                            args: testCase.args,
                            field: testCase.field,
                        }).column(column);
                    }).toThrowError(
                        testCase.output ? String(testCase.output) : undefined
                    );
                } else {
                    verifyObjectEntity(input);

                    const frame = DataFrame.fromJSON(
                        testCase.config,
                        [input],
                    );
                    expect(() => {
                        dataFrameAdapter(fnDef, {
                            args: testCase.args,
                            field: testCase.field,
                        }).frame(frame);
                    }).toThrowError(
                        testCase.output ? String(testCase.output) : undefined
                    );
                }
            });
        });
    });
}

function verifyObjectEntity(data: unknown): asserts data is Record<string, unknown> {
    if (isObjectEntity(data)) return;
    throw new Error('Record transformations require record data as test input');
}

function serializeBigIntegers(input: unknown): any {
    if (isBigInt(input)) return bigIntToJSON(input);
    if (input == null || typeof input !== 'object') return input;

    if (Array.isArray(input)) {
        return input.map(serializeBigIntegers);
    }
    const obj = {};
    for (const prop in obj) {
        if (hasOwn(obj, prop)) {
            obj[prop] = serializeBigIntegers(obj[prop]);
        }
    }
    return obj;
}
