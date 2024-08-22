import { FieldTransform } from '@terascope/data-mate';

export default () => FieldTransform.extract(this.opConfig.extractString, { foo: 'bar' }, { jexlExp: '[foo]' });
