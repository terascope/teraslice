
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { OperationConfig, WatcherConfig, Operation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class SelectionPhase extends PhaseBase {
    private opConfig: WatcherConfig;
    readonly selectionPhase: Operation[];

    constructor(opConfig: WatcherConfig, configList:OperationConfig[], opsManager: OperationsManager) {
        super();
        this.opConfig = opConfig;
        const selectionPhase: Operation[] = [];
        const dict = {};
        const Selector = opsManager.getTransform('selector');

        configList.forEach((config: OperationConfig) => {
            if (config.selector && !config.follow && !config.other_match_required) dict[config.selector] = true;
        });

        _.forOwn(dict, (_value, selector) => selectionPhase.push(new Selector({ selector }, this.opConfig.types)));
        console.log('what is selectionPhase', selectionPhase)
        this.selectionPhase = selectionPhase;
    }

    public run(data: DataEntity[]): DataEntity[] {
        if (this.selectionPhase.length > 0) {
            const results = [];
            for (let i = 0; i < data.length; i += 1) {
                const record = data[i];
                for (let j = 0; j < this.selectionPhase.length; j += 1) {
                    this.selectionPhase[j].run(record);
                }
                const recordMeta = record.getMetadata('selectors');
                if (recordMeta) {
                    results.push(record);
                }
            }
            return results;
        }

        return [];
    }
}
