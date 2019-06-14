import { Role } from '@terascope/data-access';
import { OverwriteModel } from '../ModelForm';

export type Input = OverwriteModel<Role>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name'];
