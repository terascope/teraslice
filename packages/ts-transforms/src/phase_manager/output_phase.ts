
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class OutputPhase extends PhaseBase {
    // @ts-ignore
    private opConfig: WatcherConfig;
    private hasMultiValue: boolean;

    constructor(_opConfig: WatcherConfig, configList:OperationConfig[], _opsManager: OperationsManager) {
        super();
        this.hasMultiValue = _.some(configList, 'multivalue');
    }

    normalize(doc: DataEntity) {
        const multiValueList = doc.getMetadata('_multi_target_fields');
        if (multiValueList != null) {
            // this iterates over a given target_field
            _.forOwn(multiValueList, (sourceKeyObj, targetFieldName) => {
                const multiValueField: any[] = [];
                // this iterates over the list of keys being put into target_field
                _.forOwn(sourceKeyObj, (_bool, sourceKey) => {
                    const data = _.get(doc, sourceKey);
                    if (data != null) multiValueField.push(data);
                    _.unset(doc, sourceKey);
                });
                doc[targetFieldName] = multiValueField;
            });
        }
    }

    public run(data: DataEntity[]): DataEntity[] {
        if (this.hasMultiValue) {
            data.forEach(this.normalize);
            return data;
        }

        return data;
    }
}
