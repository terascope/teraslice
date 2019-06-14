import { DataType } from '@terascope/data-access';
import { AvailableTypes } from '@terascope/data-types';
import { OverwriteModel } from '../ModelForm';

export type Input = OverwriteModel<DataType>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name', 'config'];

export const dataTypeOptions = AvailableTypes.sort().map(t => ({
    key: t,
    text: t,
    value: t,
}));
