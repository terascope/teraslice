import {
    DeprecatedFieldType, FieldType,
    DTFieldConfigWithDataGenOpts,
    RandomDataCategory as Category
} from '@terascope/types';
import { faker } from '@faker-js/faker';

export function isNonStringFieldType(type: FieldType | DeprecatedFieldType) {
    const nonTextFields: (FieldType | DeprecatedFieldType)[] = [
        FieldType.Boolean,
        FieldType.Boundary,
        FieldType.Byte,
        FieldType.Double,
        FieldType.Float,
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Geo,
        FieldType.Integer,
        FieldType.Long,
        FieldType.Number,
        FieldType.Object,
        FieldType.Short,
        FieldType.Tuple,
        FieldType.Vector
    ];
    return nonTextFields.includes(type);
}

export function isNumericFieldType(type: FieldType | DeprecatedFieldType) {
    const numericTypes: (FieldType | DeprecatedFieldType)[] = [
        FieldType.Short,
        FieldType.Number,
        FieldType.Long,
        FieldType.Float,
        FieldType.Integer,
        FieldType.Double,
        FieldType.Byte
    ];
    return numericTypes.includes(type);
}

export function isTextFieldType(type: FieldType | DeprecatedFieldType) {
    const numericTypes: (FieldType | DeprecatedFieldType)[] = [
        FieldType.Text,
        FieldType.String,
        FieldType.Keyword,
        FieldType.KeywordCaseInsensitive,
        FieldType.KeywordPathAnalyzer,
        FieldType.KeywordTokens,
        FieldType.KeywordTokensCaseInsensitive,
    ];
    return numericTypes.includes(type);
}

export function fineTuneNumericField(
    field: string,
    originalFn: () => any,
    fieldConfig: DTFieldConfigWithDataGenOpts,
    chance: Chance.Chance
): (() => any) {
    const fn = originalFn;
    const { min, max, precision } = fieldConfig.numbers || {};

    const things = [
        ['age', chance.age],
        ['altitude', () => chance.altitude({ min: min, max: max, fixed: precision })],
        ['depth', () => chance.depth({ min: min, max: max, fixed: precision })],
        ['hour', chance.hour],
        ['latitude', () => chance.latitude({ min: min, max: max, fixed: precision })],
        ['longitude', () => chance.longitude({ min: min, max: max, fixed: precision })],
        ['millisecond', chance.millisecond],
        ['minute', chance.minute],
        ['second', chance.second],
        ['timestamp', chance.timestamp]
    ];

    const found = things.find((thing) => field.includes(thing[0] as string));
    if (found) return found?.[1] as () => any;

    if (field.includes('year')) {
        return () => Number(chance.year({ min: min, max: max }));
    }

    return fn;
}

export function fineTuneTextField(
    field: string,
    originalFn: () => any,
    fildConfig: DTFieldConfigWithDataGenOpts,
    chance: Chance.Chance
): (() => any) {
    const categoryFn = getTextFieldFn(field, chance, fildConfig);

    return categoryFn || originalFn;
}

function getTextFieldFn(
    field: string,
    chance: Chance.Chance,
    fildConfig: DTFieldConfigWithDataGenOpts
) {
    const { category, library } = fildConfig.text || {};
    const { max, min, precision } = fildConfig.numbers || {};

    const things: (string | ((opts?: any | undefined) => string))[][] = [
        ['first', chance.first],
        ['last', chance.last],
        // NAME - if no first/last
        ['name',
            ({
                book: faker.book.title,
                company: faker.company.name,
                file: faker.system.fileName,
                music: faker.music.songName,
                person: chance.name,
                pet: faker.animal.petName,
            } as Record<Category, any>
            )[category as Category] || chance.name
        ],
        // list animals, then animal last
        ['bear', faker.animal.bear],
        ['bird', faker.animal.bird],
        ['cat', faker.animal.cat],
        ['cetacean', faker.animal.cetacean],
        ['marinemammal', faker.animal.cetacean],
        ['cow', faker.animal.cow],
        ['crocodilia', faker.animal.crocodilia],
        ['dog', faker.animal.dog],
        ['fish', faker.animal.fish],
        ['horse', faker.animal.horse],
        ['bug', faker.animal.insect],
        ['insect', faker.animal.insect],
        ['lion', faker.animal.lion],
        ['pet', faker.animal.petName],
        ['rabbit', faker.animal.rabbit],
        ['rodent', faker.animal.rodent],
        ['snake', faker.animal.snake],
        // ANIMAL - if none above
        ['animal',
            {
                chance: chance.animal,
                faker: faker.animal.type,
            }[library as string] || chance.animal
        ],
        // AIRLINES
        ['aircraft', faker.airline.aircraftType],
        ['airline', () => faker.airline.airline().name],
        ['airplane', () => faker.airline.airplane().name],
        ['airport', () => faker.airline.airport().name],
        ['flightnumber', faker.airline.flightNumber],
        ['recordlocator', faker.airline.recordLocator],
        ['seat', faker.airline.seat],
        // FOOD
        ['ethnicity', faker.food.ethnicCategory],
        ['fruit', faker.food.fruit],
        ['meat', faker.food.meat],
        ['spice', faker.food.spice],
        ['ingredient', faker.food.ingredient],
        ['dish', faker.food.dish],
        // BOOKS/MUSIC
        ['author', faker.book.author],
        ['format', faker.book.format],
        ['publisher', faker.book.publisher],
        ['series', faker.book.series],
        ['title', faker.book.title],
        ['album', faker.music.album],
        ['artist', faker.music.artist],
        ['song', faker.music.songName],
        ['genre',
            ({
                music: faker.music.genre,
                book: faker.book.genre
            } as Record<Category, any>
            )[category as Category] || chance.pickone([
                faker.music.genre,
                faker.book.genre
            ])],
        // try keep alphabetical except for categories like above
        ['account', faker.finance.accountName],
        ['accountnumber', faker.finance.accountNumber],
        ['amount', () => faker.finance.amount({ min, max, dec: precision })],
        ['country',
            chance.country(
                field.includes('code')
                    ? undefined
                    : { full: true }
            )
        ],
        ['address', chance.address],
        ['areacode', chance.areacode],
        ['avatar', chance.avatar],
        ['bicycle', faker.vehicle.bicycle],
        ['city', chance.city],
        ['color', chance.color],
        ['company', chance.company],
        ['coordinates', chance.coordinates],
        ['cost', () => chance.dollar({ max })],
        ['creditcard', chance.cc_type],
        ['department', faker.commerce.department],
        ['description',
            ({
                food: faker.food.description,
                commerce: faker.commerce.productDescription,
                finance: faker.finance.transactionDescription,
                job: faker.person.jobDescriptor,
            } as Record<Category, any>
            )[category as Category] || chance.pickone([
                faker.commerce.productDescription,
                faker.food.description
            ])],
        ['domainname', () => faker.internet.domainName()],
        ['domainsuffix', faker.internet.domainSuffix],
        ['email', chance.email],
        ['emoji', faker.internet.emoji],
        ['gender', chance.gender],
        ['hashtag', chance.hashtag],
        // HASH - if no hashtag
        ['hash', chance.hash],
        ['isbn', faker.commerce.isbn],
        ['job', chance.profession],
        ['locale', chance.locale],
        ['manufacturer', faker.vehicle.manufacturer],
        ['material', faker.commerce.productMaterial],
        ['model', faker.vehicle.model],
        ['phone', chance.phone],
        ['portrait', faker.image.personPortrait],
        ['product', faker.commerce.product],
        ['profession', chance.profession],
        ['prefix', chance.prefix],
        ['province', chance.province],
        ['radio', chance.radio],
        ['routingnumber', faker.finance.routingNumber],
        ['state', chance.state],
        ['suffix', chance.suffix],
        ['ssn', chance.ssn],
        ['timezone', () => chance.timezone().name],
        ['tv', chance.tv],
        ['twitter', chance.twitter],
        ['type',
            ({
                aircraft: faker.airline.aircraftType,
                animal: library === 'faker'
                    ? faker.animal.type
                    : chance.pickone(['ocean', 'desert', 'grassland', 'forest', 'farm', 'pet', 'zoo']),
                book: faker.book.genre,
                file: faker.system.commonFileType,
                job: faker.person.jobType,
                music: faker.music.genre,
                vehicle: faker.vehicle.type,
            } as Record<Category, any>
            )[category as Category] || faker.word.noun],
        ['upc', faker.commerce.upc],
        ['url', chance.url],
        ['userAgent', faker.internet.userAgent],
        ['vehicle', faker.vehicle.vehicle],
        ['weekday', chance.weekday],
        ['year', chance.year],
        ['zip', chance.zip],
        ['zodiac', faker.person.zodiacSign],
    ];

    const found = things
        .find(
            (thing) => field
                .toLowerCase()
                .replaceAll(/[_-]/g, '')
                .includes(thing[0] as string)
        );

    if (found) {
        const foundFn = found[1] as () => any;
        if (isAnonymousFunction(foundFn)) {
            return () => foundFn;
        }
        return foundFn;
    }

    if (!found) {
        if (['key', '_key', 'id', '_id', 'uuid', 'guid'].includes(field)) {
            return () => chance.guid();
        }
    }
}

function isAnonymousFunction(fn: any) {
    return (fn instanceof Function) && fn?.name === '';
}
