
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class OutputPhase extends PhaseBase {
    // @ts-ignore
    private opConfig: WatcherConfig;
    private hasMultiValue: boolean;
    private restrictOutput: object;
    private hasRestrictedOutput: boolean;

    constructor(_opConfig: WatcherConfig, configList:OperationConfig[], _opsManager: OperationsManager) {
        super();
        this.hasMultiValue = _.some(configList, 'multivalue');
        this.restrictOutput = this.getOutRestrictionList(configList);
        this.hasRestrictedOutput = _.keys(this.restrictOutput).length > 0;
    }

    getOutRestrictionList(configList:OperationConfig[]): object {
        const list = {};
        configList.forEach((config) => {
            if (config.output !== undefined) {
                const { configuration } = this.normalizeConfig(config, 'output', configList);
                // TODO: potential issue here
                list[configuration.target_field as string] = true;
            }
        });
        return list;
    }

    normalizeFields(doc: DataEntity) {
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
        let results = data;
        // console.log('data at output', results)
        if (this.hasMultiValue) {
            results.forEach(this.normalizeFields);
        }

        if (this.hasRestrictedOutput) {
           // console.log('im in the restricted', this.restrictOutput)
            const restrictedData: DataEntity[] = [];
            results.forEach((doc: DataEntity) => {
              //  console.log('the doc', doc, this.restrictOutput)
                _.forOwn(this.restrictOutput, (_value, key) => {
                    _.unset(doc, key);
                });
                if (_.keys(doc).length > 0) restrictedData.push(doc);
              //  console.log('restrictedData', restrictedData)
            });
            results = restrictedData;
        }
        return results;
    }

}
