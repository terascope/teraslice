import { Repository } from '../interfaces';

export const respoitory: Repository = {
};

export function renameField(record: any, args: { oldFieldName: string; newFieldName: string }) {
    const { oldFieldName, newFieldName } = args;

    record[newFieldName] = record[oldFieldName];

    delete record[oldFieldName];

    return record;
}

