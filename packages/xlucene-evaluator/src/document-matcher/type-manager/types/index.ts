import BaseType from './base';
import DateType from './dates';
import GeoType from './geo';
import IpType from './ip';
import TermType from './term';

export interface TypeMapping {
    date: DateType;
    ip: IpType;
    term: TermType;
    geo: GeoType;
}

const typeMapping = {
    date: DateType,
    ip: IpType,
    term: TermType,
    geo: GeoType,
};

export default typeMapping;
export { BaseType };
