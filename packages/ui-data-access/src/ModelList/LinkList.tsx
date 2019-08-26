import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { get } from '@terascope/utils';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../interfaces';
import { getModelConfig } from '../config';

const LinkList: React.FC<Props> = ({ records, modelName }) => {
    const { pathname } = getModelConfig(modelName);
    return (
        <>
            {records.map((record) => (
                <Link key={record.id} to={`/${pathname}/edit/${record.id}`}>
                    {record.name}
                </Link>
            ))}
        </>
    );
};

type LinkRecord = { id: string; name: string };
type Props = {
    modelName: ModelName;
    records: LinkRecord[];
};

LinkList.propTypes = {
    modelName: ModelNameProp.isRequired,
    records: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export function makeLinkList<T>(modelName: ModelName, key: keyof T) {
    return (input: T): any => {
        const result = get(input, key) as LinkRecord[] | LinkRecord;
        if (!result) return '--';
        if (Array.isArray(result)) {
            if (!result) return '--';
            return <LinkList records={result} modelName={modelName} />;
        }
        return <LinkList records={[result]} modelName={modelName} />;
    };
}

export default LinkList;
