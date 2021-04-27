import { DataTypeConfig } from '@terascope/types';
import {
    functionAdapter,
    dataFrameAdapter,
    FunctionDefinitionConfig,
    DataFrame
} from '../../src';

export interface FunctionTestCaseConfig {
    readonly config: DataTypeConfig;
    readonly data: Record<string, unknown>[];
}

/**
 * This tests a function config
*/
export function functionTestHarness(
    fnDef: FunctionDefinitionConfig<Record<string, unknown>>,
    cases: readonly [msg: string, config: FunctionTestCaseConfig][],
): void {
    describe(fnDef.name, () => {
        describe.each(cases)('%s', (_msg, config) => {
            describe('when using the function adapter', () => {
                it('should return the correct data', () => {
                    expect(functionAdapter(fnDef).rows(config.data)).toMatchSnapshot();
                });
            });

            describe('when using the data frame adapter', () => {
                it('should return the correct data', () => {
                    const frame = DataFrame.fromJSON(config.config, config.data);
                    expect(dataFrameAdapter(fnDef).frame(frame)).toMatchSnapshot();
                });
            });
        });
    });
}
