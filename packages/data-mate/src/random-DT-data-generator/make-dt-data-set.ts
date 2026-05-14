import { hasOwn, isEmpty } from '@terascope/core-utils';
import { DeprecatedFieldType, FieldType } from '@terascope/types';
import { DTConfigWithDataGenOpts } from '@terascope/types';
import { makeRandomDataFunctionForField } from './make-dt-field-fn.js';
import { getChildDataTypeConfig } from '../index.js';

/**
 * Generates an array of records based on the data type field config of count
 */
export function makeRandomDataSet(
    fields: DTConfigWithDataGenOpts['fields'],
    total = 3,
    isStressTest = false
): Record<string, any>[] | undefined {
    if (isEmpty(fields)) return;

    const { fns, parents } = collectFieldFnsAndParents(fields);

    const makeField = () => {
        const record: any = {};
        for (const key in fns) {
            if (!Object.hasOwn(fns, key)) continue;
            record[key] = fns[key]();
        }

        populateParentFields(record, parents);

        return record;
    };

    const stressTestRecord = isStressTest
        ? makeField()
        : undefined;

    const records: Record<string, any>[] = [];
    for (let i = 0; i < total; i++) {
        records.push(stressTestRecord || makeField());
    }

    return records;
}

const validParentTypes: Record<string, boolean> = {
    [FieldType.Object]: true,
    [FieldType.Tuple]: true
};
const parentTypesStr = Object.keys(validParentTypes).join(', ');

/**
 * Loops through fields, creating functions to generate data, unless the field has
 * child fields - then it will populate after the child fields have been created
 */
function collectFieldFnsAndParents(fields: DTConfigWithDataGenOpts['fields']) {
    const fns: Record<string, () => any> = {};
    const parents: { field: string; type: FieldType | DeprecatedFieldType }[] = [];

    for (const field in fields) {
        if (hasOwn(fields, field)) {
            const config = fields[field];
            const children = getChildDataTypeConfig(fields, field, config.type as FieldType);

            if (children && validParentTypes[config.type]) {
                parents.push({ field, type: config.type });
            } else {
                fns[field] = makeRandomDataFunctionForField(config, field);
            }
        }
    }

    return { fns, parents };
}

function populateParentFields(
    record: Record<string, any>,
    parents: { field: string; type: FieldType | DeprecatedFieldType }[]
) {
    const objects: string[] = [];
    const tuples: string[] = [];
    const unknown: string[] = [];
    parents.forEach(({ field, type }) => {
        let ary = unknown;
        if (type === 'Object') ary = objects;
        if (type === 'Tuple') ary = tuples;
        ary.push(field);
    });

    if (objects.length) {
        populateParentObjects(record, objects);
    }
    if (tuples.length) {
        populateParentTuples(record, tuples);
    }
    if (unknown.length) {
        const msg = `Received fields w/children ${unknown.join(',')}. Child support currently only available for ${parentTypesStr} field types.`;
        console.error(msg);
    }
}

function populateParentTuples(record: Record<string, any>, tupleFields: string[]) {
    for (const tuple of tupleFields) {
        const values = [];

        for (const [key, value] of Object.entries(record)) {
            if (!key.startsWith(tuple + '.')) continue;

            const indexStr = key.slice(tuple.length + 1);
            const index = Number(indexStr);

            if (!Number.isNaN(index)) {
                values[index] = value;
            }
        }

        record[tuple] = values;
    }
}

function populateParentObjects(record: Record<string, any>, objFields: string[]) {
    for (const objField of objFields) {
        record[objField] = {};

        let found = false;
        for (const [key, value] of Object.entries(record)) {
            if (!key.startsWith(`${objField}.`)) continue;

            // Remove prefix from nested object path
            const nestedPath = key.slice(objField.length + 1);
            setNestedField(record[objField], nestedPath, value);
            found = true;
        }

        if (!found) {
            addEmptyObject(record, objField);
        }
    }
}

function setNestedField(obj: Record<string, any>, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] ??= {};
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
}

/** ensure empty objects are added to the record - i.e. a.b.c -> a: { b: { c: {} } } */
function addEmptyObject(record: Record<string, any>, path: string) {
    const keys = path.split('.');
    let current = record;

    for (const key of keys) {
        if (current[key] == null) {
            current[key] = {};
        }
        current = current[key];
    }
}
