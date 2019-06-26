import { DataType } from '@terascope/data-access';
import { AvailableTypes } from '@terascope/data-types';
import { OverwriteModelWith } from '../ModelForm';

export type Input = OverwriteModelWith<
    DataType,
    {
        inherit_from: string[];
    }
>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name', 'config', 'inherit_from'];

export const dataTypeOptions = AvailableTypes.sort().map(t => ({
    key: t,
    text: t,
    value: t,
}));
