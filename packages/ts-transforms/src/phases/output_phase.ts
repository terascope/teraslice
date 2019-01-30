
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
    private requirements: object;
    private hasRestrictedOutput: boolean;
    private hasRequirements: boolean;

    constructor(_opConfig: WatcherConfig, configList:OperationConfig[], _opsManager: OperationsManager) {
        super();
        this.hasMultiValue = _.some(configList, 'multivalue');
        this.restrictOutput = this.getOutputRestrictionList(configList);
        this.requirements = this.extractionRequirements(configList);
        this.hasRequirements = _.keys(this.requirements).length > 0;
        this.hasRestrictedOutput = _.keys(this.restrictOutput).length > 0;
    }

    extractionRequirements(configList:OperationConfig[]) {
        const requirements = {};
        _.each(configList, (config: OperationConfig) => {
            if (config.other_match_required) {
                const key = config.target_field || config.source_field;
                requirements[key as string] = true;
            }
        });
        return requirements;
    }

    getOutputRestrictionList(configList:OperationConfig[]): object {
        const list = {};
        _.each(configList, (config: OperationConfig) => {
            if (config.output !== undefined && config.validation == null) {
                const { configuration } = this.normalizeConfig(config, 'output', configList);
                list[configuration.target_field as string] = true;
            }
        });
        return list;
    }

    normalizeFields(data: DataEntity[]) {
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

    requiredExtractions(data: DataEntity[]) {
        const finalResults: DataEntity[] = [];

        _.each(data, (doc: DataEntity) => {
            let otherExtractionsFound = false;
            let requireExtractionsFound = false;

            _.forOwn(doc, (_value, key) => {
                if (_.has(this.requirements, key)) requireExtractionsFound = true;
                if (!_.has(this.requirements, key)) otherExtractionsFound = true;
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
            results = this.normalizeFields(results);
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
