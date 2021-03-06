'use strict';

const { isEmpty } = require('@terascope/utils');
const { FieldType } = require('@terascope/types');
const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const {
    DataFrame, functionConfigRepository,
    FunctionDefinitionType, dataFrameAdapter
} = require('./src');

/**
 * @todo add tuple support
 * @param fieldType {import('@terascope/types').FieldType}
*/
function getFieldType(fieldType) {
    if (fieldType === FieldType.Long) return FieldType.Number;
    if (fieldType === FieldType.Byte) return FieldType.Number;
    if (fieldType === FieldType.Short) return FieldType.Number;
    if (fieldType === FieldType.Float) return FieldType.Number;
    if (fieldType === FieldType.Double) return FieldType.Number;
    if (fieldType === FieldType.Integer) return FieldType.Number;
    if (fieldType === FieldType.Domain) return FieldType.String;
    if (fieldType === FieldType.Keyword) return FieldType.String;
    if (fieldType === FieldType.KeywordCaseInsensitive) return FieldType.String;
    if (fieldType === FieldType.KeywordPathAnalyzer) return FieldType.String;
    if (fieldType === FieldType.KeywordCaseInsensitive) return FieldType.String;
    if (fieldType === FieldType.KeywordTokens) return FieldType.String;
    if (fieldType === FieldType.KeywordTokensCaseInsensitive) return FieldType.String;
    if (fieldType === FieldType.Hostname) return FieldType.String;
    if (fieldType === FieldType.Text) return FieldType.String;
    return fieldType;
}

const run = async () => {
    const suite = Suite('Transform/Validate Column');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        Object.entries(functionConfigRepository)
            .filter(([, fnDef]) => {
                if (fnDef.type !== FunctionDefinitionType.FIELD_TRANSFORM
                    && fnDef.type !== FunctionDefinitionType.FIELD_VALIDATION) {
                    return false;
                }
                if (fnDef.required_arguments && fnDef.required_arguments.length) {
                    return false;
                }
                if (
                    !isEmpty(fnDef.accepts)
                    && !fnDef.accepts.includes(getFieldType(column.config.type))
                ) {
                    return false;
                }
                return true;
            })
            .forEach(([name, fnDef]) => {
                suite.add(`${fieldInfo} ${name}`, {
                    fn() {
                        dataFrameAdapter(fnDef).column(column);
                    }
                });
            });
    }

    return suite.run({
        async: true,
        initCount: 2,
        minSamples: 2,
        maxTime: 20,
    });
};
if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
