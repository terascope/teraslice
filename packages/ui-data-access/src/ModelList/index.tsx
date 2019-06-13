import React from 'react';
import { ModelName } from '@terascope/data-access';
import ListQuery from './Query';
import { DataTable, RowMapping } from '@terascope/ui-components';
import { getModelConfig } from '../config';
import { ModelNameProp } from '../interfaces';

const ModelList: React.FC<Props> = ({ modelName }) => {
    const config = getModelConfig(modelName);

    return (
        <ListQuery modelName={modelName}>
            {({ updateQueryState, queryState, total, records, loading }) => {
                return (
                    <DataTable
                        rowMapping={config.rowMapping as RowMapping}
                        baseEditPath={`/${config.pathname}/edit`}
                        exportRecords={async () => {
                            throw new Error(
                                `Exporting all ${config.pluralLabel} in not supported yet`
                            );
                        }}
                        loading={loading}
                        records={records}
                        total={total}
                        queryState={queryState}
                        updateQueryState={updateQueryState}
                    />
                );
            }}
        </ListQuery>
    );
};

type Props = {
    modelName: ModelName;
};

ModelList.propTypes = {
    modelName: ModelNameProp.isRequired,
};

export default ModelList;
