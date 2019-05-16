
import { DataType } from './datatype';

export function getGraphQlTypes(types: DataType[]) {
    const customTypesList: string[] = [];
    const baseTypeList: string[] = [];

    types.forEach((type) => {
        const { baseType, customTypes } = type.toGraphQl();
        customTypesList.push(...customTypes);
        baseTypeList.push(baseType);
    });

    return `
        ${baseTypeList.join('\n')}
        ${[...new Set(customTypesList)].join('\n')}
    `;
}
