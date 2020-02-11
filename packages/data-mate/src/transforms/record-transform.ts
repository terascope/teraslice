import { Repository } from '../interfaces';

export const respoitory: Repository = {
};

export function renameField(record: any, args: { oldFieldName: string; newFieldName: string }) {
    const { oldFieldName, newFieldName } = args;
    record[newFieldName] = record[oldFieldName];
    delete record[oldFieldName];

    return record;
}

export function setField(record: any, args: { name: string; value: any }) {
    record[args.name] = args.value;
    return record;
}

export function dropField(record: any, args: { name: string }) {
    delete record[args.name];
    return record;
}

export function copyField(record: any, args: { name: string; copyTo: string }) {
    record[args.copyTo] = record.name;
    return record;
}
