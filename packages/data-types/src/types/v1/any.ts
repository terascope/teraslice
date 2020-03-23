import BaseType from '../base-type';

export default class AnyType extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: { [this.field]: { enabled: false } }
        };
    }

    toGraphQL() {
        return this._formatGql('JSON');
    }

    toXlucene() {
        return {};
    }
}
