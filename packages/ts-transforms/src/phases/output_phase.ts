
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { WatcherConfig, OutputValidation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class OutputPhase extends PhaseBase {
    // @ts-ignore
    private hasMultiValue: boolean;
    private restrictOutput: object;
    private matchRequirements: object;
    private hasRestrictedOutput: boolean;
    private hasRequirements: boolean;

    constructor(opConfig: WatcherConfig, outputConfig:OutputValidation, _opsManager: OperationsManager) {
        super(opConfig);
        // console.log('the output stuff', outputConfig)
        this.hasMultiValue = outputConfig.hasMultiValue;
        this.restrictOutput = outputConfig.restrictOutput;
        this.matchRequirements = outputConfig.matchRequirements;
        this.hasRequirements = _.keys(this.matchRequirements).length > 0;
        this.hasRestrictedOutput = _.keys(this.restrictOutput).length > 0;
    }

    combineMultiFields(data: DataEntity[]) {
        return data.map((doc) => {
            const multiValueList = doc.getMetadata('_multi_target_fields');
            if (multiValueList != null) {
                // this iterates over a given target_field
                _.forOwn(multiValueList, (sourceKeyObj, targetFieldName) => {
                    const multiValueField: any[] = [];
                    // this iterates over the list of keys being put into target_field
                    _.forOwn(sourceKeyObj, (_bool, sourceKey) => {
                        const data = _.get(doc, sourceKey);
                        if (data !== undefined) multiValueField.push(data);
                        _.unset(doc, sourceKey);
                    });
                    if (multiValueField.length > 0) doc[targetFieldName] = multiValueField;
                });
            }
            return doc;
        });
    }

    restrictFields(data: DataEntity[]) {
        const restrictedData: DataEntity[] = [];
        _.each(data, (doc: DataEntity) => {
            _.forOwn(this.restrictOutput, (_value, key) => {
                _.unset(doc, key);
            });
            if (_.keys(doc).length > 0) restrictedData.push(doc);
        });
        return restrictedData;
    }

    isKeyMatchRequired(key: string, docSelectorData: object): boolean {
        let bool = false;
        const requiredKey = this.matchRequirements[key];

        if (requiredKey !== undefined) {
            if (requiredKey === '*') bool = true;
            if (requiredKey !== '*' && docSelectorData[requiredKey]) bool = true;
        }

        return bool;
    }

    requiredExtractions(data: DataEntity[]) {
        const finalResults: DataEntity[] = [];

        _.each(data, (doc: DataEntity) => {
            let otherExtractionsFound = false;
            let requireExtractionsFound = false;
            const docSelectorData = doc.getMetadata('selectors');

            _.forOwn(doc, (_value, key) => {
                if (this.isKeyMatchRequired(key, docSelectorData)) {
                    requireExtractionsFound = true;
                } else {
                    otherExtractionsFound = true;
                }
            });

            if (!requireExtractionsFound || (requireExtractionsFound && otherExtractionsFound)) {
                finalResults.push(doc);
            }
        });

        return finalResults;
    }

    public run(data: DataEntity[]): DataEntity[] {
        let results = data;

        if (this.hasMultiValue) {
            results = this.combineMultiFields(results);
        }

        if (this.hasRestrictedOutput) {
            results = this.restrictFields(results);
        }

        if (this.hasRequirements) {
            results = this.requiredExtractions(results);
        }

        return results;
    }
}
