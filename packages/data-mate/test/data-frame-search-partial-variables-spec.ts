import 'jest-extended';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeConfig, FieldType, Maybe
} from '@terascope/types';
import { DataFrame } from '../src';

describe('DataFrame->search', () => {
    type PartialPerson = {
        name?: Maybe<string>;
        age?: Maybe<number>;
        alive?: Maybe<boolean>;
        friends?: Maybe<Maybe<string>[]>
    }

    let partialPeopleDataFrame: DataFrame<PartialPerson>;

    const peopleDTConfig: DataTypeConfig = {
        version: LATEST_VERSION,
        fields: {
            name: {
                type: FieldType.Keyword,
            },
            age: {
                type: FieldType.Short,
            },
            alive: {
                type: FieldType.Boolean,
            },
            friends: {
                type: FieldType.Keyword,
                array: true,
            }
        }
    };

    function createPartialPeopleDataFrame(data: PartialPerson[]): DataFrame<PartialPerson> {
        return DataFrame.fromJSON<PartialPerson>(peopleDTConfig, data);
    }

    beforeAll(() => {
        partialPeopleDataFrame = createPartialPeopleDataFrame([
            {
                alive: true,
                friends: ['Frank', 'Jane'] // sucks for Billy
            },
            {
                name: 'Billy',
                friends: ['Jill']
            },
            {
                age: 20,
                friends: ['Jill']
            },
            {
                name: 'Jane',
                age: 10,
                alive: false,
                friends: ['Jill']
            },
            {
                name: 'Nancy',
                age: 10,
                friends: null
            },
        ]);
    });

    it('should be able to search on partial data', () => {
        const resultFrame = partialPeopleDataFrame
            .search('name:Jill OR age:>=12')
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toEqual([
            {
                age: 20,
                friends: ['Jill']
            },

        ]);
    });

    it('should be able to search with partial variables in simple queries)', () => {
        const resultFrame = partialPeopleDataFrame
            .search('name:@name', { '@name': undefined })
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toBeArrayOfSize(0);
    });

    it('should be able to search with partial variables in OR statements (term type)', () => {
        const resultFrame = partialPeopleDataFrame
            .search('name:@name OR age:@age', { '@name': undefined, '@age': 20 })
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toEqual([
            {
                age: 20,
                friends: ['Jill']
            }
        ]);
    });

    it('should be able to search with partial variables in OR statements (int type)', () => {
        const resultFrame = partialPeopleDataFrame
            .search('name:@name OR age:@age', { '@name': 'Billy', '@age': undefined })
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toEqual([
            {
                name: 'Billy',
                friends: ['Jill']
            },
        ]);
    });

    it('should be able to search with partial variables in AND statements', () => {
        const resultFrame = partialPeopleDataFrame
            .search('name:@name AND age:@age', { '@name': 'Billy', '@age': undefined })
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toBeArrayOfSize(0);
    });

    it('should be able to search with partial variables in Complex statements', () => {
        const variables = {
            '@name': 'Billy',
            '@age': undefined,
            '@alive': false
        };
        const resultFrame = partialPeopleDataFrame
            .search('name:@name OR (age:@age OR alive:@alive)', variables)
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toEqual([
            {
                name: 'Billy',
                friends: ['Jill']
            },
            {
                name: 'Jane',
                age: 10,
                alive: false,
                friends: ['Jill']
            },
        ]);
    });

    it('should be able to search with partial variables in Complex AND statements', () => {
        const variables = {
            '@name': undefined,
            '@age': 10,
            '@alive': false
        };
        const resultFrame = partialPeopleDataFrame
            .search('name:@name OR (age:@age AND alive:@alive)', variables)
            .select('age', 'alive', 'name', 'friends');

        expect(resultFrame.toJSON()).toEqual([
            {
                name: 'Jane',
                age: 10,
                alive: false,
                friends: ['Jill']
            },
        ]);
    });
});
