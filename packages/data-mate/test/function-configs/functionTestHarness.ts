import { isObjectEntity } from '@terascope/utils';
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
    cases: readonly FunctionDefinitionExample<T>[] = [],
): void {
    describe(fnDef.name, () => {
        type Case = [
            unknown, T, FunctionDefinitionExample<T>
        ];
        const testCases: Case[] = cases.concat(fnDef.examples ?? []).map((c) => (
            [c.input, c.args, c]
        ));
        describe('when using the function adapter', () => {
            test.each(testCases)('should handle the input %p with args %p', (input, _a, testCase) => {
                if (isFieldTransform(fnDef) || isFieldValidation(fnDef)) {
                    expect(functionAdapter(fnDef, {
                        args: testCase.args,
                        field: testCase.field,
                        config: testCase.config
                    }).column([input])).toEqual([testCase.output]);
                } else {
                    verifyObjectEntity(input);
                    expect(functionAdapter(fnDef, {
                        args: testCase.args,
                        field: testCase.field,
                        config: testCase.config
                    }).rows([input])).toEqual([testCase.output]);
                }
            });
        });

        describe('when using the data frame adapter', () => {
            test.each(testCases)('should handle the input %p with args %p', (input, _a, testCase) => {
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

                    expect(outputColumn.toJSON()).toEqual([testCase.output ?? undefined]);
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
        });
    });
}

function verifyObjectEntity(data: unknown): asserts data is Record<string, unknown> {
    if (isObjectEntity(data)) return;
    throw new Error('Record transformations require record data as test input');
}
