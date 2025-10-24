import { DataEntity } from '@terascope/entity-utils';
import * as i from '../interfaces.js';
import PhaseBase from './base.js';
import { OperationsManager } from '../operations/index.js';

export default class SelectionPhase extends PhaseBase {
    readonly selectionPhase: i.Operation[];

    constructor(
        opConfig: i.WatcherConfig,
        selectorList: i.SelectorConfig[],
        opsManager: OperationsManager
    ) {
        super(opConfig);
        this.opConfig = opConfig;

        const matcherConfig: i.MatcherConfig = {
            type_config: opConfig.type_config,
            variables: opConfig.variables
        };

        const Selector = opsManager.getTransform('selector');
        this.selectionPhase = selectorList
            .map((config) => new Selector(config, matcherConfig));
    }

    public run(data: DataEntity[]): DataEntity[] {
        if (this.selectionPhase.length > 0) {
            const results = [];
            for (const record of data) {
                record.setMetadata('selectors', null);
                for (const selector of this.selectionPhase) {
                    selector.run(record);
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
