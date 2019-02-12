import BaseType from './base';
import DateType from './dates';
import GeoType from './geo';
import IpType from './ip';
import StringType from './string';

export interface TypeMapping {
    date: DateType;
    ip: IpType;
    string: StringType;
    geo: GeoType;
}

const typeMapping = {
    date: DateType,
    ip: IpType,
    string: StringType,
    geo: GeoType,
};

export default typeMapping;
export { BaseType };
