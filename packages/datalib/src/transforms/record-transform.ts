import { Repository } from '../interfaces';

export const respoitory: Repository = {
};

export function renameField(record: any, args: { oldFieldName: string; newFieldName: string }) {
    const { oldFieldName, newFieldName } = args;

    record[newFieldName] = record[oldFieldName];

    delete record[oldFieldName];

    return record;
}

export function setField(record: any, args: { name: string, value: any }) {
    return record[args.name] = args.value;
}

export function dropField(record: any, args: { name: string }) {
    delete record[args.name];

    return record;
}


// copy field


