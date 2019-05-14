
export interface DataTypeManager {

    toESMapping(): any;
    toGraphQl(): any;
    toXlucene(): any;
}

export interface Type {
    field: string;
    baseType: string;
    toESMapping(): any;
    toGraphQl(): any;
    toXlucene(): any;
}
