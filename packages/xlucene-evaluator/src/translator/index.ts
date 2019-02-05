import { TypeConfig } from '../interfaces';

export default class Translator {
    query: string;
    public types?: TypeConfig;

    constructor(query: string, types?: TypeConfig) {
        this.query = query;
        this.types = types;
    }

    toElasticsearchDSL() {
        return {
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                hello: 'world'
                            }
                        }
                    ]
                }
            }
        };
    }
}
