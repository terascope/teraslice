import 'jest-extended';
import { isObjectEntity } from '@terascope/utils';
import {
    dataFrameAdapter,
    FunctionDefinitionConfig,
    DataFrame,
    isFieldTransform,
    isFieldValidation,
    Column,
    FunctionDefinitionExample,
    getDataTypeFieldAndChildren,
} from '../../src/index.js';

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

        describe('when using the data frame adapter', () => {
            test.each(successCases)('should handle the input %p with args %p', (input, _a, testCase) => {
                function getOutput(output: unknown) {
                    if (output == null) return [undefined];
                    if (testCase.serialize_output) {
                        return [testCase.serialize_output(
                            output
                        )];
                    }
                    return [output];
                }

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

                    const results = outputColumn.toJSON();

                    expect(results).toEqual(
                        getOutput(testCase.output)
                    );
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

                    expect(outputFrame.toJSON()).toEqual(
                        getOutput(testCase.output)
                    );
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
                    }).toThrow(
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
                    }).toThrow(
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
