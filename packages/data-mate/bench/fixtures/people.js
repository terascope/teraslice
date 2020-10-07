'use strict';

module.exports = {
    config: {
        fields: {
            _key: {
                type: 'Keyword'
            },
            name: {
                type: 'Keyword'
            },
            age: {
                type: 'Integer'
            },
            ssn: {
                type: 'Keyword'
            },
            favorite_animal: {
                type: 'Keyword'
            },
            ip: {
                type: 'IP'
            },
            phone: {
                type: 'Keyword'
            },
            birthday: {
                type: 'Date'
            },
            address: {
                type: 'Text'
            },
            alive: {
                type: 'Boolean'
            },
            location: {
                type: 'GeoPoint'
            }
        }
    },
    data: [
        {
            _key: '437760f8-d298-4553-bbc6-40d2b7b72b7d',
            name: 'Timothy Johnson',
            age: 37,
            ssn: '307-82-2421',
            favorite_animal: 'Finch',
            ip: '172.242.221.81',
            phone: null,
            birthday: '1983-08-02T22:21:46.816Z',
            address: '1730 Bamis Plaza',
            alive: true,
            location: {
                lat: 84.02952,
                lon: -5.52116
            }
        },
        {
            _key: '25787936-390b-4635-84ef-a9bdda1e1aba',
            name: 'Gordon Daniels',
            age: 57,
            ssn: '793-71-3074',
            favorite_animal: 'Silkworm',
            ip: '168.150.209.186',
            phone: '(374) 718-4552',
            birthday: '1963-04-26T17:59:21.722Z',
            address: '857 Zokpo Terrace',
            alive: true,
            location: {
                lat: -56.92051,
                lon: 88.85908
            }
        },
        {
            _key: 'e9d60e5a-c9cb-4966-946b-6da931de086f',
            name: 'Ellen Underwood',
            age: 40,
            ssn: '409-48-4473',
            favorite_animal: 'Narwhal',
            ip: null,
            phone: null,
            birthday: '1980-01-08T09:15:40.103Z',
            address: '1465 Tigo Glen',
            alive: false,
            location: {
                lat: 84.87889,
                lon: -15.55753
            }
        },
        {
            _key: '31894ccb-76ff-4e9d-b009-6a403a972e87',
            name: null,
            age: 61,
            ssn: '314-68-2459',
            favorite_animal: 'Duck',
            ip: null,
            phone: '(255) 597-7969',
            birthday: '1959-01-31T05:07:17.703Z',
            address: '795 Gewge Way',
            alive: false,
            location: {
                lat: -42.22823,
                lon: 101.78159
            }
        },
        {
            _key: 'd03c7fd2-c0ed-47a3-85b8-3e6f8079b5ee',
            name: 'Helena Wolfe',
            age: 65,
            ssn: '492-63-1495',
            favorite_animal: "Linne's Two-toed Sloth",
            ip: '131.6.249.185',
            phone: '(914) 506-8903',
            birthday: '1955-02-10T01:54:59.410Z',
            address: '416 Tuhelo Center',
            alive: false,
            location: {
                lat: -21.34256,
                lon: 28.26545
            }
        },
        {
            _key: '5879a371-863a-44a1-89c2-48dc5670400e',
            name: 'Estelle Price',
            age: null,
            ssn: '941-58-9798',
            favorite_animal: 'Meerkat',
            ip: '14.209.60.115',
            phone: null,
            birthday: '1992-07-13T20:59:55.051Z',
            address: '1709 Hoenu Key',
            alive: true,
            location: {
                lat: -27.3571,
                lon: -97.91285
            }
        },
        {
            _key: '528904a3-ed73-4975-a399-364da731ddfa',
            name: 'Emilie Wagner',
            age: 41,
            ssn: '252-23-0428',
            favorite_animal: 'Oarfish',
            ip: '76.111.15.125',
            phone: '(487) 689-4107',
            birthday: '1979-02-28T05:23:57.723Z',
            address: '276 Bitju Path',
            alive: true,
            location: {
                lat: -22.45195,
                lon: -161.71318
            }
        },
        {
            _key: 'f118ab27-fdd8-4b3a-b017-89115ef1cd77',
            name: 'Isabelle Herrera',
            age: null,
            ssn: '134-17-7561',
            favorite_animal: 'Wildcat',
            ip: '95.118.102.140',
            phone: '(346) 203-1086',
            birthday: '1996-10-09T05:39:33.854Z',
            address: '744 Pigpe Grove',
            alive: false,
            location: {
                lat: 29.9816,
                lon: 8.05579
            }
        },
        {
            _key: '548e4e66-49a9-47e9-824c-5b5a3cb25cd8',
            name: 'Evelyn Singleton',
            age: 41,
            ssn: '817-82-3717',
            favorite_animal: 'Blue Tang',
            ip: '174.119.212.143',
            phone: '(665) 925-8744',
            birthday: '1979-10-07T03:18:10.897Z',
            address: '414 Cilbir Ridge',
            alive: true,
            location: {
                lat: 54.64737,
                lon: 76.57259
            }
        },
        {
            _key: '2e207414-0f4f-40c8-8658-b7a2b36a5bc5',
            name: 'Derek Keller',
            age: null,
            ssn: '361-52-1092',
            favorite_animal: 'Anaconda',
            ip: '15.0.161.90',
            phone: '(600) 667-6220',
            birthday: '1997-09-12T07:04:20.276Z',
            address: '930 Medu View',
            alive: true,
            location: {
                lat: -48.33102,
                lon: -100.74078
            }
        },
        {
            _key: '9e013ad5-1013-4716-8819-7955d63187e4',
            name: 'Gavin Cortez',
            age: 46,
            ssn: '529-28-7651',
            favorite_animal: 'Giraffe',
            ip: '182.182.232.160',
            phone: '(982) 630-6384',
            birthday: '1974-08-15T21:29:15.096Z',
            address: '966 Coma Way',
            alive: false,
            location: {
                lat: 74.53863,
                lon: 29.86588
            }
        },
        {
            _key: 'f745bfb3-e104-4839-aa92-f8e387c48900',
            name: 'Vernon Mullins',
            age: null,
            ssn: '305-39-5606',
            favorite_animal: 'Ant',
            ip: '119.244.137.170',
            phone: '(976) 772-4569',
            birthday: '1991-02-08T00:58:22.364Z',
            address: '1305 Ukez Heights',
            alive: true,
            location: {
                lat: 68.5181,
                lon: 34.89926
            }
        },
        {
            _key: '8ab3cbad-5800-4f13-a801-e016e5f9389a',
            name: 'Hunter Williamson',
            age: null,
            ssn: '860-95-5286',
            favorite_animal: 'Clam',
            ip: '151.115.221.136',
            phone: '(243) 379-9238',
            birthday: '1995-06-27T07:31:48.544Z',
            address: '1151 Duve Trail',
            alive: true,
            location: {
                lat: 11.94411,
                lon: 3.83112
            }
        },
        {
            _key: 'c0b90f66-1f03-4e53-8b0d-cdf67e8cf195',
            name: 'Amanda Hicks',
            age: 65,
            ssn: '359-75-2086',
            favorite_animal: 'Zebu',
            ip: '143.244.170.26',
            phone: '(357) 862-2163',
            birthday: '1955-08-17T15:17:02.816Z',
            address: '1800 Fuwhuf Lane',
            alive: true,
            location: {
                lat: 84.19382,
                lon: -73.74301
            }
        },
        {
            _key: '975806df-fc8f-4455-bc22-68c43974be76',
            name: null,
            age: 52,
            ssn: '183-82-9693',
            favorite_animal: 'Honey',
            ip: '146.148.82.220',
            phone: '(956) 396-1128',
            birthday: '1968-12-01T20:52:38.754Z',
            address: '1344 Tihwif Center',
            alive: false,
            location: {
                lat: -50.86212,
                lon: 165.59667
            }
        },
        {
            _key: 'a9e87fc1-1c4f-4941-abe3-863a16dcab8b',
            name: 'Peter Alvarez',
            age: 42,
            ssn: '733-52-4469',
            favorite_animal: 'Rabbit',
            ip: '96.55.4.85',
            phone: '(878) 798-7021',
            birthday: '1978-08-28T02:13:57.964Z',
            address: '458 Hibnu Way',
            alive: false,
            location: {
                lat: 82.34967,
                lon: 13.93874
            }
        },
        {
            _key: '548e4e66-49a9-47e9-824c-5b5a3cb25cd8',
            name: 'Evelyn Singleton',
            age: 41,
            ssn: '817-82-3717',
            favorite_animal: 'Blue Tang',
            ip: '174.119.212.143',
            phone: '(665) 925-8744',
            birthday: '1979-10-07T03:18:10.897Z',
            address: '414 Cilbir Ridge',
            alive: true,
            location: {
                lat: 54.64737,
                lon: 76.57259
            }
        },
        {
            _key: '2e207414-0f4f-40c8-8658-b7a2b36a5bc5',
            name: 'Derek Keller',
            age: null,
            ssn: '361-52-1092',
            favorite_animal: 'Anaconda',
            ip: '15.0.161.90',
            phone: '(600) 667-6220',
            birthday: '1997-09-12T07:04:20.276Z',
            address: '930 Medu View',
            alive: true,
            location: {
                lat: -48.33102,
                lon: -100.74078
            }
        },
        {
            _key: '9e013ad5-1013-4716-8819-7955d63187e4',
            name: 'Gavin Cortez',
            age: 46,
            ssn: '529-28-7651',
            favorite_animal: 'Giraffe',
            ip: '182.182.232.160',
            phone: '(982) 630-6384',
            birthday: '1974-08-15T21:29:15.096Z',
            address: '966 Coma Way',
            alive: false,
            location: {
                lat: 74.53863,
                lon: 29.86588
            }
        },
        {
            _key: 'f745bfb3-e104-4839-aa92-f8e387c48900',
            name: 'Vernon Mullins',
            age: null,
            ssn: '305-39-5606',
            favorite_animal: 'Ant',
            ip: '119.244.137.170',
            phone: '(976) 772-4569',
            birthday: '1991-02-08T00:58:22.364Z',
            address: '1305 Ukez Heights',
            alive: true,
            location: {
                lat: 68.5181,
                lon: 34.89926
            }
        },
        {
            _key: '8ab3cbad-5800-4f13-a801-e016e5f9389a',
            name: 'Hunter Williamson',
            age: null,
            ssn: '860-95-5286',
            favorite_animal: 'Clam',
            ip: '151.115.221.136',
            phone: '(243) 379-9238',
            birthday: '1995-06-27T07:31:48.544Z',
            address: '1151 Duve Trail',
            alive: true,
            location: {
                lat: 11.94411,
                lon: 3.83112
            }
        },
        {
            _key: 'c0b90f66-1f03-4e53-8b0d-cdf67e8cf195',
            name: 'Amanda Hicks',
            age: 65,
            ssn: '359-75-2086',
            favorite_animal: 'Zebu',
            ip: '143.244.170.26',
            phone: '(357) 862-2163',
            birthday: '1955-08-17T15:17:02.816Z',
            address: '1800 Fuwhuf Lane',
            alive: true,
            location: {
                lat: 84.19382,
                lon: -73.74301
            }
        },
        {
            _key: '975806df-fc8f-4455-bc22-68c43974be76',
            name: null,
            age: 52,
            ssn: '183-82-9693',
            favorite_animal: 'Honey',
            ip: '146.148.82.220',
            phone: '(956) 396-1128',
            birthday: '1968-12-01T20:52:38.754Z',
            address: '1344 Tihwif Center',
            alive: false,
            location: {
                lat: -50.86212,
                lon: 165.59667
            }
        },
        {
            _key: '67805277-1457-47f9-b12e-527dd8931bba',
            name: 'Peter Alvarez',
            age: 42,
            ssn: '733-52-4469',
            favorite_animal: 'Rabbit',
            ip: '96.55.4.25',
            phone: '(878) 798-7021',
            birthday: '1978-08-28T02:13:57.964Z',
            address: '458 Banana Way',
            alive: false,
            location: {
                lat: 82.34967,
                lon: 13.93874
            }
        },
        {
            _key: '82d92711-9469-4a4e-962f-8fe79f9228ee',
            name: 'Loretta Scott',
            age: null,
            ssn: '589-61-3866',
            favorite_animal: 'Mule',
            ip: '108.80.243.54',
            phone: '(462) 692-4189',
            birthday: '2000-01-31T19:37:50.187Z',
            address: '1068 Reus Street',
            alive: true,
            location: {
                lat: 18.42444,
                lon: 83.10438
            }
        },
        {
            _key: '198f0588-c250-4bb0-b5ab-741827971d97',
            name: 'Samuel Burton',
            age: 54,
            ssn: '667-11-3702',
            favorite_animal: 'Anteater',
            ip: '7.45.11.187',
            phone: '(828) 549-3774',
            birthday: '1966-07-20T17:14:49.730Z',
            address: '1221 Wolor Terrace',
            alive: false,
            location: {
                lat: -74.87633,
                lon: -52.38134
            }
        },
        {
            _key: 'a70e6402-e6b3-4cfa-b8ec-38ad552af614',
            name: null,
            age: 40,
            ssn: '331-55-3003',
            favorite_animal: 'Rhea',
            ip: '75.48.174.86',
            phone: '(919) 728-6050',
            birthday: '1980-08-03T07:12:59.640Z',
            address: '406 Paze View',
            alive: true,
            location: {
                lat: -46.17919,
                lon: -91.18403
            }
        },
        {
            _key: '189f5eac-fe11-4cc7-a31d-1148d7ad9dc6',
            name: 'Francisco Guerrero',
            age: 38,
            ssn: '369-52-8061',
            favorite_animal: 'Bowerbird',
            ip: '147.76.125.180',
            phone: '(945) 500-3016',
            birthday: '1982-06-17T20:00:36.898Z',
            address: '1275 Avto Point',
            alive: false,
            location: {
                lat: -58.62976,
                lon: -120.67175
            }
        },
        {
            _key: '82f6cb5d-856c-4c25-b0d1-2a79542523e5',
            name: 'Myra Burns',
            age: null,
            ssn: '644-56-3156',
            favorite_animal: 'Chickens',
            ip: '161.196.23.76',
            phone: '(608) 654-4181',
            birthday: '1994-12-13T14:05:52.615Z',
            address: '800 Zorbop Mill',
            alive: true,
            location: {
                lat: -39.3809,
                lon: 139.58379
            }
        },
        {
            _key: '64fd7fc2-90cc-46ee-b069-f85f17f138e3',
            name: 'Gabriel Harvey',
            age: 41,
            ssn: '264-35-9995',
            favorite_animal: 'Cow',
            ip: '113.196.155.78',
            phone: '(974) 659-5865',
            birthday: '1979-09-04T16:22:31.889Z',
            address: '1452 Piogu Trail',
            alive: true,
            location: {
                lat: 78.36414,
                lon: -177.43527
            }
        },
        {
            _key: '3ea81b18-de86-4892-8838-a037232c7844',
            name: null,
            age: null,
            ssn: '217-51-0362',
            favorite_animal: 'Hedgehogs',
            ip: '173.122.227.40',
            phone: '(434) 754-4189',
            birthday: '1995-11-07T12:01:37.507Z',
            address: '1114 Ezebaz Trail',
            alive: true,
            location: {
                lat: -38.49574,
                lon: -45.95667
            }
        },
        {
            _key: '66ecf42f-741e-4708-8002-2f653063322a',
            name: 'Vera Martin',
            age: 49,
            ssn: '851-11-9167',
            favorite_animal: 'Pycnogonid Sea Spider',
            ip: '125.195.225.83',
            phone: '(239) 891-1962',
            birthday: '1971-07-22T02:12:17.007Z',
            address: '1031 Tukdic Drive',
            alive: true,
            location: {
                lat: 35.89567,
                lon: -62.74303
            }
        },
        {
            _key: 'eb1ce458-f6cc-404e-af34-6c509bd8bcfd',
            name: 'Shawn Franklin',
            age: 19,
            ssn: '989-24-6042',
            favorite_animal: 'Copepod',
            ip: '127.109.159.189',
            phone: '(730) 549-1097',
            birthday: '2001-02-13T10:16:36.897Z',
            address: '1010 Pagor Square',
            alive: false,
            location: {
                lat: 65.64311,
                lon: -162.30694
            }
        },
        {
            _key: '8d35863d-a233-4f08-a8cc-a2d9b157812f',
            name: 'Arthur McCarthy',
            age: 60,
            ssn: '175-34-3144',
            favorite_animal: 'Spotted Dolphin',
            ip: '117.117.38.245',
            phone: null,
            birthday: '1960-11-03T15:20:52.127Z',
            address: '241 Judnen Avenue',
            alive: true,
            location: {
                lat: 19.91124,
                lon: -90.20468
            }
        },
        {
            _key: '7bd251a1-4e95-4367-8095-015622e9fd8f',
            name: 'Mina Tate',
            age: null,
            ssn: '479-72-2844',
            favorite_animal: 'Dunnart',
            ip: '168.43.209.168',
            phone: '(876) 657-6167',
            birthday: '1996-05-12T09:16:33.926Z',
            address: '574 Vuvuh Boulevard',
            alive: false,
            location: {
                lat: 44.62073,
                lon: -81.87044
            }
        },
        {
            _key: '0603f49c-17f1-490a-ac2d-77503a61bdd2',
            name: null,
            age: null,
            ssn: '558-55-8362',
            favorite_animal: 'Kiwa Hirsuta',
            ip: '196.138.180.120',
            phone: '(452) 262-5372',
            birthday: '1992-11-20T20:22:15.482Z',
            address: '437 Agjo Way',
            alive: false,
            location: {
                lat: 68.86511,
                lon: 126.44921
            }
        },
        {
            _key: 'a5b588cf-0b20-4467-a001-3c15b66ed05b',
            name: 'Virgie Gomez',
            age: 51,
            ssn: '789-07-3108',
            favorite_animal: 'Beluga Whale',
            ip: null,
            phone: '(827) 646-7614',
            birthday: '1969-11-09T09:22:01.059Z',
            address: '1891 Utasuf Park',
            alive: false,
            location: {
                lat: -33.25007,
                lon: 66.06684
            }
        },
        {
            _key: 'ecbd3413-3fbe-4577-b9f6-9302b2cfa1d2',
            name: 'Keith Shelton',
            age: 58,
            ssn: '920-18-1587',
            favorite_animal: 'Fish',
            ip: '126.84.220.16',
            phone: '(743) 355-3721',
            birthday: '1962-08-14T15:15:56.158Z',
            address: '235 Ecjij Terrace',
            alive: false,
            location: {
                lat: 61.80473,
                lon: 5.91929
            }
        },
        {
            _key: '7a5755e1-b47c-4742-807c-2b752f6a9f6e',
            name: 'Katherine Gonzalez',
            age: 41,
            ssn: '810-56-3432',
            favorite_animal: 'Giraffe',
            ip: '126.76.135.162',
            phone: '(770) 858-3534',
            birthday: '1979-04-16T22:43:18.520Z',
            address: '262 Rokjek Lane',
            alive: false,
            location: {
                lat: 68.49506,
                lon: 16.47661
            }
        },
        {
            _key: 'fe0dceb1-7fef-49df-a464-4f0951bfc98e',
            name: 'Ola Wallace',
            age: 34,
            ssn: '446-42-7794',
            favorite_animal: 'Toad',
            ip: '96.120.22.33',
            phone: '(719) 212-6710',
            birthday: '1986-06-25T16:18:07.117Z',
            address: '1147 Mortal Manor',
            alive: true,
            location: {
                lat: 88.37686,
                lon: 30.62773
            }
        },
        {
            _key: '42e6cc6a-f6f4-49cb-968e-507a77277d62',
            name: 'Caleb Powell',
            age: 51,
            ssn: '088-39-1096',
            favorite_animal: 'Crow',
            ip: '11.70.107.57',
            phone: '(841) 362-9108',
            birthday: '1969-09-28T03:19:11.731Z',
            address: '1081 Mofidi Road',
            alive: false,
            location: {
                lat: 39.62385,
                lon: -1.85025
            }
        },
        {
            _key: '447f882c-c54d-4434-b0cb-1c47943736ae',
            name: 'Hunter Kennedy',
            age: null,
            ssn: '641-09-2162',
            favorite_animal: 'Python',
            ip: '14.178.61.49',
            phone: '(346) 227-9863',
            birthday: '1996-12-27T08:05:55.314Z',
            address: '1238 Wendim Path',
            alive: false,
            location: {
                lat: 27.01111,
                lon: -166.87134
            }
        },
        {
            _key: 'b6f54ccb-c14d-4d35-a23f-c9a9179f0cac',
            name: 'Francis Parks',
            age: null,
            ssn: '133-42-6851',
            favorite_animal: 'Antelope',
            ip: '133.169.167.106',
            phone: '(942) 308-3908',
            birthday: '1995-02-16T11:29:05.561Z',
            address: '153 Arifap Lane',
            alive: false,
            location: {
                lat: 50.39546,
                lon: -76.36638
            }
        },
        {
            _key: 'fa92f99e-5e42-4b1b-aa9f-1e411efce884',
            name: null,
            age: 59,
            ssn: '854-84-6138',
            favorite_animal: 'Honey',
            ip: null,
            phone: '(755) 669-1362',
            birthday: '1961-10-26T13:08:44.817Z',
            address: '1457 Zuznab Point',
            alive: false,
            location: {
                lat: 7.72884,
                lon: -82.96043
            }
        },
        {
            _key: '10de587c-e7b9-4c07-af2c-b1bd1b95dd30',
            name: 'Cora Hunt',
            age: 41,
            ssn: '928-70-6577',
            favorite_animal: 'Cheetah',
            ip: null,
            phone: '(419) 562-4875',
            birthday: '1979-12-11T20:14:31.261Z',
            address: '1693 Pegom Street',
            alive: true,
            location: {
                lat: -69.20095,
                lon: 140.11199
            }
        },
        {
            _key: '927c0b27-2bf4-44c3-82f6-6229680cb3f9',
            name: 'Myrtle Robinson',
            age: 46,
            ssn: '412-96-9181',
            favorite_animal: 'Rattlesnake',
            ip: null,
            phone: '(418) 315-4680',
            birthday: '1974-01-30T23:05:28.779Z',
            address: '485 Digek Lane',
            alive: false,
            location: {
                lat: 20.03866,
                lon: 179.38962
            }
        },
        {
            _key: 'ee8d3b35-916b-477e-a45f-9f8e925de647',
            name: 'Victoria Buchanan',
            age: 52,
            ssn: '692-03-5765',
            favorite_animal: 'Ponies',
            ip: null,
            phone: '(850) 351-4602',
            birthday: '1968-05-16T16:55:47.106Z',
            address: '336 Misune Lane',
            alive: true,
            location: {
                lat: -77.95049,
                lon: -160.31208
            }
        },
        {
            _key: 'e1977bbd-93f9-4de0-b486-2f7b174b4db0',
            name: 'Mitchell Gross',
            age: 30,
            ssn: '720-67-8367',
            favorite_animal: 'Kangaroo',
            ip: '160.155.189.28',
            phone: '(838) 829-5397',
            birthday: '1990-02-09T15:23:26.273Z',
            address: '1569 Hehbud View',
            alive: true,
            location: {
                lat: 49.07144,
                lon: -114.15215
            }
        },
        {
            _key: 'b623485b-ed43-42eb-8d35-93961d737b1c',
            name: 'Christopher Mendoza',
            age: 62,
            ssn: '015-17-9936',
            favorite_animal: 'Stick Bug',
            ip: '192.70.15.9',
            phone: '(623) 971-1287',
            birthday: '1958-09-23T21:13:51.692Z',
            address: '778 Seil Highway',
            alive: false,
            location: {
                lat: 42.7194,
                lon: -39.87436
            }
        },
        {
            _key: 'a0a39a97-b097-4fbc-9c60-3ad9274aa162',
            name: 'Nettie Washington',
            age: 62,
            ssn: '064-13-9846',
            favorite_animal: 'Horses',
            ip: '10.53.144.211',
            phone: '(970) 260-3123',
            birthday: '1958-12-14T08:15:36.556Z',
            address: '1446 Wata Avenue',
            alive: true,
            location: {
                lat: -84.78861,
                lon: 82.24083
            }
        },
        {
            _key: 'ecbd3413-3fbe-4577-b9f6-9302b2cfa1d2',
            name: 'Keith Shelton',
            age: 58,
            ssn: '920-18-1587',
            favorite_animal: 'Fish',
            ip: '126.84.220.16',
            phone: '(743) 355-3721',
            birthday: '1962-08-14T15:15:56.158Z',
            address: '235 Ecjij Terrace',
            alive: false,
            location: {
                lat: 61.80473,
                lon: 5.91929
            }
        },
        {
            _key: '7a5755e1-b47c-4742-807c-2b752f6a9f6e',
            name: 'Katherine Gonzalez',
            age: 41,
            ssn: '810-56-3432',
            favorite_animal: 'Giraffe',
            ip: '126.76.135.162',
            phone: '(770) 858-3534',
            birthday: '1979-04-16T22:43:18.520Z',
            address: '262 Rokjek Lane',
            alive: false,
            location: {
                lat: 68.49506,
                lon: 16.47661
            }
        },
        {
            _key: 'fe0dceb1-7fef-49df-a464-4f0951bfc98e',
            name: 'Ola Wallace',
            age: 34,
            ssn: '446-42-7794',
            favorite_animal: 'Toad',
            ip: '96.120.22.33',
            phone: '(719) 212-6710',
            birthday: '1986-06-25T16:18:07.117Z',
            address: '1147 Mortal Manor',
            alive: true,
            location: {
                lat: 88.37686,
                lon: 30.62773
            }
        },
        {
            _key: '42e6cc6a-f6f4-49cb-968e-507a77277d62',
            name: 'Caleb Powell',
            age: 51,
            ssn: '088-39-1096',
            favorite_animal: 'Crow',
            ip: '11.70.107.57',
            phone: '(841) 362-9108',
            birthday: '1969-09-28T03:19:11.731Z',
            address: '1081 Mofidi Road',
            alive: false,
            location: {
                lat: 39.62385,
                lon: -1.85025
            }
        },
        {
            _key: '447f882c-c54d-4434-b0cb-1c47943736ae',
            name: 'Hunter Kennedy',
            age: null,
            ssn: '641-09-2162',
            favorite_animal: 'Python',
            ip: '14.178.61.49',
            phone: '(346) 227-9863',
            birthday: '1996-12-27T08:05:55.314Z',
            address: '1238 Wendim Path',
            alive: false,
            location: {
                lat: 27.01111,
                lon: -166.87134
            }
        },
        {
            _key: 'b6f54ccb-c14d-4d35-a23f-c9a9179f0cac',
            name: 'Francis Parks',
            age: null,
            ssn: '133-42-6851',
            favorite_animal: 'Antelope',
            ip: '133.169.167.106',
            phone: '(942) 308-3908',
            birthday: '1995-02-16T11:29:05.561Z',
            address: '153 Arifap Lane',
            alive: false,
            location: {
                lat: 50.39546,
                lon: -76.36638
            }
        },
        {
            _key: 'fa92f99e-5e42-4b1b-aa9f-1e411efce884',
            name: null,
            age: 59,
            ssn: '854-84-6138',
            favorite_animal: 'Honey',
            ip: null,
            phone: '(755) 669-1362',
            birthday: '1961-10-26T13:08:44.817Z',
            address: '1457 Zuznab Point',
            alive: false,
            location: {
                lat: 7.72884,
                lon: -82.96043
            }
        },
        {
            _key: '10de587c-e7b9-4c07-af2c-b1bd1b95dd30',
            name: 'Cora Hunt',
            age: 41,
            ssn: '928-70-6577',
            favorite_animal: 'Cheetah',
            ip: null,
            phone: '(419) 562-4875',
            birthday: '1979-12-11T20:14:31.261Z',
            address: '1693 Pegom Street',
            alive: true,
            location: {
                lat: -69.20095,
                lon: 140.11199
            }
        },
        {
            _key: '927c0b27-2bf4-44c3-82f6-6229680cb3f9',
            name: 'Myrtle Robinson',
            age: 46,
            ssn: '412-96-9181',
            favorite_animal: 'Rattlesnake',
            ip: null,
            phone: '(418) 315-4680',
            birthday: '1974-01-30T23:05:28.779Z',
            address: '485 Digek Lane',
            alive: false,
            location: {
                lat: 20.03866,
                lon: 179.38962
            }
        },
        {
            _key: 'ee8d3b35-916b-477e-a45f-9f8e925de647',
            name: 'Victoria Buchanan',
            age: 52,
            ssn: '692-03-5765',
            favorite_animal: 'Ponies',
            ip: null,
            phone: '(850) 351-4602',
            birthday: '1968-05-16T16:55:47.106Z',
            address: '336 Misune Lane',
            alive: true,
            location: {
                lat: -77.95049,
                lon: -160.31208
            }
        },
        {
            _key: 'e1977bbd-93f9-4de0-b486-2f7b174b4db0',
            name: 'Mitchell Gross',
            age: 30,
            ssn: '720-67-8367',
            favorite_animal: 'Kangaroo',
            ip: '160.155.189.28',
            phone: '(838) 829-5397',
            birthday: '1990-02-09T15:23:26.273Z',
            address: '1569 Hehbud View',
            alive: true,
            location: {
                lat: 49.07144,
                lon: -114.15215
            }
        },
        {
            _key: 'b623485b-ed43-42eb-8d35-93961d737b1c',
            name: 'Christopher Mendoza',
            age: 62,
            ssn: '015-17-9936',
            favorite_animal: 'Stick Bug',
            ip: '192.70.15.9',
            phone: '(623) 971-1287',
            birthday: '1958-09-23T21:13:51.692Z',
            address: '778 Seil Highway',
            alive: false,
            location: {
                lat: 42.7194,
                lon: -39.87436
            }
        },
        {
            _key: 'a0a39a97-b097-4fbc-9c60-3ad9274aa162',
            name: 'Nettie Washington',
            age: 62,
            ssn: '064-13-9846',
            favorite_animal: 'Horses',
            ip: '10.53.144.211',
            phone: '(970) 260-3123',
            birthday: '1958-12-14T08:15:36.556Z',
            address: '1446 Wata Avenue',
            alive: true,
            location: {
                lat: -84.78861,
                lon: 82.24083
            }
        },
        {
            _key: 'a84e0c8b-fe5b-4840-91db-12dd7649efba',
            name: 'Alma Hogan',
            age: 61,
            ssn: '797-68-5480',
            favorite_animal: 'Banteng',
            ip: '117.185.229.151',
            phone: null,
            birthday: '1959-05-26T18:17:30.344Z',
            address: '23 Bavah Parkway',
            alive: true,
            location: {
                lat: 14.62591,
                lon: 25.87553
            }
        },
        {
            _key: 'c324f0ae-b1d0-401c-94be-47607458625c',
            name: 'Amelia Lopez',
            age: 38,
            ssn: '712-89-5166',
            favorite_animal: 'Kiwa Hirsuta',
            ip: null,
            phone: null,
            birthday: '1982-07-10T01:46:20.213Z',
            address: '573 Wasum Path',
            alive: false,
            location: {
                lat: 65.07169,
                lon: -4.4313
            }
        },
        {
            _key: '9aeb9dee-e658-4f99-83f4-1210e805d15c',
            name: 'Melvin Miles',
            age: 18,
            ssn: '268-60-9201',
            favorite_animal: 'Komodo Dragon',
            ip: '58.159.49.42',
            phone: '(352) 446-2908',
            birthday: '2002-11-20T10:31:21.282Z',
            address: '1071 Ciket Path',
            alive: false,
            location: {
                lat: -76.95892,
                lon: -36.55475
            }
        },
        {
            _key: '03ce4a12-f477-45b6-a87a-18a4386e89be',
            name: 'Ivan Foster',
            age: 41,
            ssn: '694-64-7901',
            favorite_animal: 'Rats',
            ip: '90.41.211.217',
            phone: '(658) 356-8462',
            birthday: '1979-11-09T11:06:37.478Z',
            address: '1092 Jipfi Extension',
            alive: true,
            location: {
                lat: 70.03485,
                lon: -166.36093
            }
        },
        {
            _key: '7490dfad-2720-4c33-b671-82530c72bd7e',
            name: null,
            age: 43,
            ssn: '288-17-6157',
            favorite_animal: 'Snakes',
            ip: null,
            phone: '(931) 277-8210',
            birthday: '1977-02-13T02:37:30.252Z',
            address: '869 Defma Circle',
            alive: true,
            location: {
                lat: 11.12592,
                lon: -26.01249
            }
        },
        {
            _key: 'f43637c1-fca5-416d-8590-1147098b507c',
            name: 'Mark Powell',
            age: 45,
            ssn: '449-24-4390',
            favorite_animal: 'Himalayan Tahr',
            ip: '35.18.169.110',
            phone: '(219) 751-8863',
            birthday: '1975-05-24T15:09:21.806Z',
            address: '1619 Vuuna Drive',
            alive: true,
            location: {
                lat: 54.84603,
                lon: -101.03135
            }
        },
        {
            _key: 'dd1340ca-c94f-48ee-a766-eacad761c208',
            name: 'Viola Ward',
            age: 38,
            ssn: '376-35-3060',
            favorite_animal: 'Nurse Shark',
            ip: '67.115.51.132',
            phone: '(904) 396-4760',
            birthday: '1982-07-29T15:25:10.683Z',
            address: '799 Voru Lane',
            alive: true,
            location: {
                lat: -51.76063,
                lon: -140.41997
            }
        },
        {
            _key: '6f1ae55b-76f6-4638-b0b8-896308264566',
            name: 'Alexander Ortiz',
            age: null,
            ssn: '295-57-4663',
            favorite_animal: 'Bearded Dragon',
            ip: '15.17.193.88',
            phone: '(666) 400-1552',
            birthday: '1997-09-29T05:56:40.945Z',
            address: '815 Izeica Highway',
            alive: false,
            location: {
                lat: -58.81291,
                lon: -103.41599
            }
        },
        {
            _key: '5a1d058e-4123-4b3f-8c71-3b017aa21caf',
            name: 'Irene Bowen',
            age: 60,
            ssn: '572-18-7197',
            favorite_animal: 'Sheep',
            ip: '13.198.110.227',
            phone: '(973) 557-9048',
            birthday: '1960-02-09T16:08:16.678Z',
            address: '993 Olkok Plaza',
            alive: false,
            location: {
                lat: -1.30346,
                lon: 99.29328
            }
        },
        {
            _key: '780d4dba-ba29-4ac4-a2b2-ef3745b14de7',
            name: 'Sarah Henderson',
            age: 53,
            ssn: '061-62-4196',
            favorite_animal: 'Goblin Shark',
            ip: '199.160.63.139',
            phone: '(616) 994-6577',
            birthday: '1967-04-07T10:21:22.103Z',
            address: '1056 Lajor Court',
            alive: false,
            location: {
                lat: 11.06983,
                lon: -171.54807
            }
        },
        {
            _key: '3643dd8f-0854-4d81-bea4-351e90296c60',
            name: 'Rose Roy',
            age: 34,
            ssn: '207-49-0852',
            favorite_animal: 'Chicken',
            ip: '18.52.111.104',
            phone: null,
            birthday: '1986-11-22T11:29:22.729Z',
            address: '1765 Tutte Drive',
            alive: true,
            location: {
                lat: 10.22306,
                lon: -28.34589
            }
        },
        {
            _key: '1471b09d-1573-4544-a6b7-adf346a68a92',
            name: null,
            age: 19,
            ssn: '640-40-2508',
            favorite_animal: 'Chilean Jack Mackerel',
            ip: '5.229.43.25',
            phone: '(716) 666-1601',
            birthday: '2001-08-12T12:42:52.752Z',
            address: '1946 Ritit Grove',
            alive: true,
            location: {
                lat: -82.97195,
                lon: -124.64275
            }
        },
        {
            _key: '4bb80ade-7e5f-4fa2-9655-dd0c4a470482',
            name: 'Katharine Lawson',
            age: 34,
            ssn: '572-83-5357',
            favorite_animal: 'Hammerhead Shark',
            ip: '70.208.88.57',
            phone: '(924) 333-9994',
            birthday: '1986-11-15T18:38:30.670Z',
            address: '1269 Reut Key',
            alive: false,
            location: {
                lat: -42.78341,
                lon: -101.49006
            }
        },
        {
            _key: '4531d78b-6a42-4cd8-a93e-8705736672be',
            name: 'Howard Terry',
            age: null,
            ssn: '054-85-9220',
            favorite_animal: 'Longnose Sawshark',
            ip: '189.111.191.29',
            phone: '(940) 971-2074',
            birthday: '1998-01-31T05:10:34.822Z',
            address: '1372 Jijlos Terrace',
            alive: false,
            location: {
                lat: -75.16545,
                lon: 52.93608
            }
        },
        {
            _key: '57ffa495-774f-4d0d-8124-ae66aaaefd22',
            name: 'Maria Newton',
            age: null,
            ssn: '970-60-1438',
            favorite_animal: 'Gerbil',
            ip: '19.15.190.211',
            phone: '(711) 241-4325',
            birthday: '1992-02-21T23:17:35.549Z',
            address: '1063 Zanam Drive',
            alive: true,
            location: {
                lat: 22.26341,
                lon: 25.17535
            }
        },
        {
            _key: '60b063bd-09f8-41e4-8522-8aa146c74949',
            name: 'Betty Thompson',
            age: 58,
            ssn: '257-95-1757',
            favorite_animal: 'Dogs',
            ip: '120.130.226.243',
            phone: null,
            birthday: '1962-01-10T11:52:25.229Z',
            address: '1644 Duspa Heights',
            alive: false,
            location: {
                lat: 79.97302,
                lon: 175.07652
            }
        },
        {
            _key: '5aa46612-e3ea-4bb7-8fb0-2801c6893779',
            name: null,
            age: null,
            ssn: '844-55-3582',
            favorite_animal: 'Stonefish',
            ip: null,
            phone: '(327) 898-9643',
            birthday: '2000-03-22T12:04:07.504Z',
            address: '1683 Gipvij River',
            alive: true,
            location: {
                lat: 52.19375,
                lon: -125.12749
            }
        },
        {
            _key: 'e0785cd7-c714-4880-aae1-91041b25822a',
            name: 'Dean Hunt',
            age: 44,
            ssn: '833-83-2303',
            favorite_animal: 'Xerus',
            ip: '15.87.18.88',
            phone: '(685) 224-4139',
            birthday: '1976-04-09T15:41:28.493Z',
            address: '870 Vuhhaz Circle',
            alive: true,
            location: {
                lat: 64.73195,
                lon: 152.29376
            }
        },
        {
            _key: '9c886432-c88d-4e67-8bbc-d277001db577',
            name: 'Brandon Delgado',
            age: 53,
            ssn: '755-44-7341',
            favorite_animal: 'Raccoon',
            ip: null,
            phone: '(314) 477-2679',
            birthday: '1967-10-26T07:03:38.199Z',
            address: '1897 Redu Extension',
            alive: false,
            location: {
                lat: -58.32055,
                lon: 66.99635
            }
        },
        {
            _key: 'edfad314-d91b-4897-aa46-8be275e2ed45',
            name: 'Polly Pierce',
            age: 54,
            ssn: '394-46-5864',
            favorite_animal: 'Helmetshrike',
            ip: '161.113.125.7',
            phone: '(986) 950-6048',
            birthday: '1966-08-29T10:18:12.752Z',
            address: '470 Kezo View',
            alive: false,
            location: {
                lat: 82.34029,
                lon: -75.75942
            }
        },
        {
            _key: 'ca5991a5-0a42-47b3-89f0-fa337d99767c',
            name: 'Marion Lindsey',
            age: 48,
            ssn: '445-34-7549',
            favorite_animal: 'Isopod',
            ip: '68.204.180.18',
            phone: '(941) 479-6259',
            birthday: '1972-12-24T07:01:32.814Z',
            address: '43 Kubris Place',
            alive: false,
            location: {
                lat: -41.21058,
                lon: -148.48129
            }
        },
        {
            _key: '7b180ef4-d4b4-4b23-9773-406519bfa0aa',
            name: 'Ernest Harper',
            age: 45,
            ssn: '272-96-8819',
            favorite_animal: "Geoffroy's Cat",
            ip: '179.233.84.235',
            phone: '(786) 768-5567',
            birthday: '1975-03-03T11:12:12.446Z',
            address: '1022 Cibrom Drive',
            alive: true,
            location: {
                lat: 61.75661,
                lon: 161.99539
            }
        },
        {
            _key: '3d569004-9c56-4752-8875-222b52d814a4',
            name: null,
            age: 49,
            ssn: '727-45-7305',
            favorite_animal: 'Goat',
            ip: '167.251.179.135',
            phone: '(224) 635-9294',
            birthday: '1971-02-01T19:32:25.961Z',
            address: '365 Deno Circle',
            alive: false,
            location: {
                lat: 53.61553,
                lon: -7.50277
            }
        },
        {
            _key: 'b736782f-bf8e-41ea-b10f-c6e0170d53dd',
            name: 'Estelle Ramsey',
            age: null,
            ssn: '027-43-6166',
            favorite_animal: "Linne's Two-toed Sloth",
            ip: '101.5.245.109',
            phone: '(864) 616-9450',
            birthday: '1998-02-22T01:08:26.846Z',
            address: '1115 Cimso Turnpike',
            alive: false,
            location: {
                lat: 5.27372,
                lon: 168.45743
            }
        },
        {
            _key: '57284fef-b2a8-478e-a769-e52b13d0d1d8',
            name: 'Nettie Vasquez',
            age: 62,
            ssn: '186-15-8594',
            favorite_animal: 'Guanaco',
            ip: '84.119.233.10',
            phone: '(271) 875-6544',
            birthday: '1958-08-03T20:22:57.456Z',
            address: '1493 Marjuj Manor',
            alive: true,
            location: {
                lat: -4.12719,
                lon: 164.77227
            }
        },
        {
            _key: '30f943e3-412c-4f5d-9636-ef6c8b541b69',
            name: 'Ricky Steele',
            age: 40,
            ssn: '061-10-6235',
            favorite_animal: 'Rattlesnake',
            ip: '74.155.46.69',
            phone: '(408) 333-2670',
            birthday: '1980-02-23T01:06:07.828Z',
            address: '1649 Nicdec Terrace',
            alive: false,
            location: {
                lat: -36.94963,
                lon: 61.22252
            }
        },
        {
            _key: '0a6b96b3-707c-44ff-9ddc-2dfbc53c03d2',
            name: 'Gavin Waters',
            age: 44,
            ssn: '021-25-9463',
            favorite_animal: 'Finch',
            ip: null,
            phone: '(268) 580-3210',
            birthday: '1976-11-04T06:42:17.996Z',
            address: '95 Usucom Square',
            alive: true,
            location: {
                lat: 38.785,
                lon: -174.43779
            }
        },
        {
            _key: '03e6871a-21e3-4985-8b31-c6a65922db46',
            name: 'Douglas Curry',
            age: 52,
            ssn: '842-80-3282',
            favorite_animal: 'Caterpillar',
            ip: '136.52.58.63',
            phone: '(688) 502-4914',
            birthday: '1968-09-01T13:30:31.423Z',
            address: '495 Ejiul Pass',
            alive: false,
            location: {
                lat: 16.42689,
                lon: 139.92918
            }
        },
        {
            _key: 'ee9af215-eec6-4187-a49b-ea1f66c954fb',
            name: 'Travis Flowers',
            age: 42,
            ssn: '039-28-0904',
            favorite_animal: 'Humpback Whale',
            ip: null,
            phone: '(670) 496-2800',
            birthday: '1978-02-07T15:32:23.531Z',
            address: '713 Upci Heights',
            alive: false,
            location: {
                lat: -24.56017,
                lon: -66.83837
            }
        },
        {
            _key: '87985779-cde2-4567-b040-690564d36237',
            name: null,
            age: 52,
            ssn: '997-31-4479',
            favorite_animal: 'King Cobra',
            ip: '162.223.209.133',
            phone: '(717) 353-3002',
            birthday: '1968-08-07T20:12:05.224Z',
            address: '391 Coba Center',
            alive: true,
            location: {
                lat: -7.12416,
                lon: -44.55159
            }
        },
        {
            _key: '8376c4b6-2345-436d-b471-031e34169532',
            name: null,
            age: 41,
            ssn: '592-84-3351',
            favorite_animal: 'Matschies Tree Kangaroo',
            ip: '163.127.228.5',
            phone: null,
            birthday: '1979-09-11T15:03:17.010Z',
            address: '410 Dehvav Circle',
            alive: true,
            location: {
                lat: 46.59383,
                lon: 150.69042
            }
        },
        {
            _key: '70942eb5-dd1b-4ad7-bb85-218c3a362433',
            name: null,
            age: 50,
            ssn: '523-28-8761',
            favorite_animal: 'Dog',
            ip: '125.252.95.97',
            phone: null,
            birthday: '1970-09-04T02:47:01.452Z',
            address: '860 Nice Place',
            alive: false,
            location: {
                lat: 69.80935,
                lon: -104.89699
            }
        },
        {
            _key: '4037a85e-4618-41ed-abf1-0e3853e680fc',
            name: 'Mittie Perry',
            age: 48,
            ssn: '977-59-7349',
            favorite_animal: 'Silkworm',
            ip: null,
            phone: '(311) 935-9364',
            birthday: '1972-09-10T01:46:03.638Z',
            address: '943 Vosub Ridge',
            alive: false,
            location: {
                lat: 43.14056,
                lon: -35.72717
            }
        },
        {
            _key: 'ede5bb43-d5bd-455a-9f62-c83d8c3e0aa2',
            name: 'Amelia Bowen',
            age: 61,
            ssn: '877-98-9310',
            favorite_animal: 'Weasel',
            ip: null,
            phone: '(645) 598-8626',
            birthday: '1959-04-08T03:16:54.621Z',
            address: '385 Vipada Court',
            alive: false,
            location: {
                lat: -87.23297,
                lon: 149.99306
            }
        },
        {
            _key: '5fde2751-758b-40f9-896b-1b17243436b5',
            name: 'Ethel Allen',
            age: null,
            ssn: '761-52-5257',
            favorite_animal: 'Toad',
            ip: '102.156.199.72',
            phone: '(215) 924-9407',
            birthday: '1991-06-06T15:40:49.688Z',
            address: '1784 Guwu Ridge',
            alive: false,
            location: {
                lat: 40.84429,
                lon: -158.61139
            }
        },
        {
            _key: '6d8d2bc6-80d0-48fc-8616-0e5e30f9c623',
            name: 'Oscar Phillips',
            age: 46,
            ssn: '099-61-4353',
            favorite_animal: 'Guinea',
            ip: '11.18.230.143',
            phone: '(243) 363-7539',
            birthday: '1974-12-16T01:25:21.578Z',
            address: '1767 Govdik Avenue',
            alive: false,
            location: {
                lat: 67.70957,
                lon: -64.95052
            }
        },
        {
            _key: '4c901a70-3ee4-496b-a275-9c14c1816d3a',
            name: 'Claudia Price',
            age: null,
            ssn: '973-24-5191',
            favorite_animal: 'Tasmanian Devil',
            ip: '117.125.85.51',
            phone: '(475) 296-8698',
            birthday: '1995-06-15T00:46:48.443Z',
            address: '991 Dibvaz Pike',
            alive: true,
            location: {
                lat: 86.35242,
                lon: -83.50842
            }
        },
        {
            _key: '62cb1e91-2283-4053-9d0f-eb233347b218',
            name: 'Annie Kennedy',
            age: 64,
            ssn: '516-35-2027',
            favorite_animal: 'Goat',
            ip: '94.201.17.43',
            phone: null,
            birthday: '1956-08-03T02:11:59.752Z',
            address: '1912 Wozfa Path',
            alive: true,
            location: {
                lat: 9.71348,
                lon: -85.8725
            }
        },
        {
            _key: '65bb6c75-1318-488f-8b61-1b62d9f2b102',
            name: 'Clarence Ortega',
            age: 54,
            ssn: '307-95-6434',
            favorite_animal: 'Eagle',
            ip: '95.163.59.61',
            phone: '(729) 626-8206',
            birthday: '1966-09-17T02:51:27.577Z',
            address: '874 Heozi Manor',
            alive: true,
            location: {
                lat: 37.22777,
                lon: 23.49048
            }
        },
        {
            _key: 'e375956f-1af4-4641-a565-09a92477f41e',
            name: 'Ricky Mendez',
            age: 50,
            ssn: '392-79-6278',
            favorite_animal: 'Albacore',
            ip: null,
            phone: '(911) 790-9196',
            birthday: '1970-02-11T03:21:02.506Z',
            address: '429 Irfu Mill',
            alive: true,
            location: {
                lat: -42.17211,
                lon: 33.2832
            }
        },
        {
            _key: '589f6bd9-d27a-4e96-868c-c129ed604288',
            name: 'Pauline Haynes',
            age: 35,
            ssn: '271-73-1342',
            favorite_animal: 'Bald Eagle',
            ip: '127.212.83.84',
            phone: '(324) 354-4152',
            birthday: '1985-02-22T08:29:09.930Z',
            address: '1241 Rawtog Drive',
            alive: false,
            location: {
                lat: 41.61535,
                lon: 62.82055
            }
        },
        {
            _key: 'b11cf73e-0dbc-43ad-a46d-1babd1fd88b9',
            name: 'Scott Perez',
            age: 53,
            ssn: '267-00-5586',
            favorite_animal: 'Hartebeest',
            ip: null,
            phone: '(359) 405-8275',
            birthday: '1967-01-16T04:24:23.939Z',
            address: '90 Cinla Place',
            alive: true,
            location: {
                lat: -10.65964,
                lon: 58.46427
            }
        },
        {
            _key: 'b440f500-c8c8-438f-844e-6ad4a8b01844',
            name: 'Blake Lopez',
            age: 60,
            ssn: '001-69-1801',
            favorite_animal: 'Stick Insects',
            ip: '7.176.26.13',
            phone: null,
            birthday: '1960-01-31T15:24:25.425Z',
            address: '1633 Covev Loop',
            alive: true,
            location: {
                lat: -65.25186,
                lon: -71.2315
            }
        },
        {
            _key: 'c11738e0-405c-428b-89e6-ce78334ee2dd',
            name: 'Hallie Webster',
            age: 33,
            ssn: '413-39-1521',
            favorite_animal: 'Dinosaur',
            ip: '113.31.194.93',
            phone: '(679) 939-5910',
            birthday: '1987-08-08T05:21:35.662Z',
            address: '6 Nuwvuh Extension',
            alive: false,
            location: {
                lat: 59.91483,
                lon: -36.57178
            }
        },
        {
            _key: 'd980e365-9efd-4965-96dd-f4d3f7bdb79d',
            name: 'Eddie Foster',
            age: 43,
            ssn: '165-01-5415',
            favorite_animal: 'Llamas',
            ip: null,
            phone: '(288) 952-1761',
            birthday: '1977-08-04T10:59:40.408Z',
            address: '1192 Bejbad Lane',
            alive: false,
            location: {
                lat: 26.22969,
                lon: 79.39155
            }
        },
        {
            _key: '20db0953-915c-4674-b345-aba7b843c831',
            name: 'Michael Sparks',
            age: 65,
            ssn: '915-23-4862',
            favorite_animal: 'Amur Tiger',
            ip: '104.150.213.136',
            phone: '(826) 771-6517',
            birthday: '1955-08-06T21:03:19.279Z',
            address: '780 Bulwok Extension',
            alive: true,
            location: {
                lat: 16.03359,
                lon: -34.61965
            }
        },
        {
            _key: '218c2a4e-a82c-4f88-8383-4981710798b6',
            name: 'Landon Alvarez',
            age: 55,
            ssn: '509-12-1890',
            favorite_animal: 'Butterfly',
            ip: '67.115.240.218',
            phone: '(951) 751-5025',
            birthday: '1965-12-31T17:05:54.458Z',
            address: '726 Pejzi Grove',
            alive: true,
            location: {
                lat: 75.3996,
                lon: -102.26507
            }
        },
        {
            _key: '3fb79216-1c5d-49d5-a586-d6481552e782',
            name: 'Dominic Abbott',
            age: 52,
            ssn: '144-72-7265',
            favorite_animal: 'Rhea',
            ip: '149.6.231.242',
            phone: '(255) 433-6503',
            birthday: '1968-07-18T07:51:24.228Z',
            address: '1750 Tebo Pass',
            alive: false,
            location: {
                lat: 23.67342,
                lon: -174.48043
            }
        },
        {
            _key: 'e4d494c0-e0c6-418b-bd44-21cd0287f3d7',
            name: 'Luis Collins',
            age: 35,
            ssn: '949-44-5815',
            favorite_animal: 'Stick Bug',
            ip: '143.29.139.16',
            phone: '(389) 522-9269',
            birthday: '1985-01-21T15:23:26.924Z',
            address: '1264 Ozce Square',
            alive: true,
            location: {
                lat: -87.88743,
                lon: -32.24725
            }
        },
        {
            _key: '187514a2-b833-40d9-9e64-5151098e537c',
            name: 'Patrick Cummings',
            age: 30,
            ssn: '361-16-9554',
            favorite_animal: 'Newt',
            ip: null,
            phone: '(200) 393-2593',
            birthday: '1990-06-18T02:40:56.524Z',
            address: '843 Guzsew Turnpike',
            alive: true,
            location: {
                lat: 51.33428,
                lon: 52.36557
            }
        },
        {
            _key: 'e3dc0d80-4ee8-4564-a711-70da46a4a724',
            name: 'Leona Fowler',
            age: 31,
            ssn: '241-43-7606',
            favorite_animal: 'Rabbit',
            ip: '112.128.152.181',
            phone: null,
            birthday: '1989-11-27T05:47:07.261Z',
            address: '1137 Cagnib Grove',
            alive: false,
            location: {
                lat: 30.92484,
                lon: 8.20355
            }
        },
        {
            _key: '0a0b4dd5-2a99-4716-ac16-12bf22f7edd0',
            name: 'Curtis Fields',
            age: 61,
            ssn: '669-42-3601',
            favorite_animal: 'Anteater',
            ip: null,
            phone: '(957) 755-6214',
            birthday: '1959-10-06T06:07:32.085Z',
            address: '1433 Jecad Point',
            alive: true,
            location: {
                lat: -2.91357,
                lon: 96.00246
            }
        },
        {
            _key: '1fcbd641-08ed-4efe-b7a2-ab0e855c69f7',
            name: 'Edna Carroll',
            age: 41,
            ssn: '301-83-9499',
            favorite_animal: 'Dog',
            ip: '184.95.63.103',
            phone: '(889) 662-9317',
            birthday: '1979-03-27T12:47:54.348Z',
            address: '1325 Ulaev Place',
            alive: true,
            location: {
                lat: 1.3156,
                lon: -59.47168
            }
        },
        {
            _key: '4a1b04d8-f430-479e-abb3-95be9dbcfacd',
            name: 'Mabelle Powell',
            age: 46,
            ssn: '103-10-9173',
            favorite_animal: 'Chinese Water Dragon',
            ip: null,
            phone: '(640) 673-3261',
            birthday: '1974-05-03T06:33:55.713Z',
            address: '1322 Icij Point',
            alive: true,
            location: {
                lat: 41.80907,
                lon: -178.67838
            }
        },
        {
            _key: '3f889d80-3651-40d9-b407-8ffac9064365',
            name: 'Tommy Barton',
            age: 34,
            ssn: '174-42-1145',
            favorite_animal: 'Goat',
            ip: '43.13.101.241',
            phone: '(328) 916-4931',
            birthday: '1986-07-01T03:52:47.657Z',
            address: '235 Agfu Ridge',
            alive: false,
            location: {
                lat: -49.74337,
                lon: -133.06347
            }
        },
        {
            _key: '8e1f64c3-1d51-46ac-8872-20ed51a00323',
            name: null,
            age: 45,
            ssn: '434-95-7606',
            favorite_animal: 'Raven',
            ip: '31.116.175.108',
            phone: '(309) 890-9980',
            birthday: '1975-06-25T04:31:37.290Z',
            address: '524 Goftow Heights',
            alive: true,
            location: {
                lat: 12.50075,
                lon: 110.43526
            }
        },
        {
            _key: '786dd831-f09b-4e37-9fdc-196800c8f856',
            name: 'Nathaniel Campbell',
            age: 60,
            ssn: '755-55-9906',
            favorite_animal: 'Christmas Tree Worm',
            ip: '155.93.161.123',
            phone: null,
            birthday: '1960-09-30T23:34:28.899Z',
            address: '1610 Aletad View',
            alive: true,
            location: {
                lat: 17.09835,
                lon: -18.31757
            }
        },
        {
            _key: '010e2827-13ef-4ac4-85fa-411e476d5688',
            name: 'Myrtie Page',
            age: null,
            ssn: '653-97-9277',
            favorite_animal: 'Giant Tortoise',
            ip: '155.207.249.101',
            phone: '(361) 739-8235',
            birthday: '1994-12-25T08:29:27.062Z',
            address: '503 Zomhi Avenue',
            alive: false,
            location: {
                lat: -73.57143,
                lon: -177.63087
            }
        },
        {
            _key: 'edb5ab65-d4f1-4aae-a4fc-44f2e10cf610',
            name: 'Luella Hernandez',
            age: 47,
            ssn: '979-14-9385',
            favorite_animal: 'Whydah',
            ip: '186.65.190.111',
            phone: '(948) 344-7397',
            birthday: '1973-02-10T21:37:35.926Z',
            address: '1920 Cipjig Loop',
            alive: false,
            location: {
                lat: -36.41519,
                lon: -106.61199
            }
        },
        {
            _key: 'ed34f138-6ec0-45bb-9b9a-13f7e5d1bc62',
            name: 'Douglas Daniels',
            age: 43,
            ssn: '146-41-1855',
            favorite_animal: 'Broadclub Cuttlefish',
            ip: '130.124.112.68',
            phone: null,
            birthday: '1977-07-08T01:51:16.854Z',
            address: '1329 Wapkej Way',
            alive: false,
            location: {
                lat: -12.93403,
                lon: -29.88954
            }
        },
        {
            _key: '1ecf34f9-a7e2-4387-85db-ebe84a3ec069',
            name: 'Eric Thomas',
            age: 60,
            ssn: '154-17-7023',
            favorite_animal: 'Leopard',
            ip: '157.51.153.162',
            phone: '(610) 993-9465',
            birthday: '1960-05-26T17:42:45.682Z',
            address: '1038 Coelu Pike',
            alive: false,
            location: {
                lat: -36.46538,
                lon: -99.22966
            }
        },
        {
            _key: '478680dd-42ae-4811-828f-8bc20ccb830e',
            name: 'Agnes Terry',
            age: 52,
            ssn: '806-98-3887',
            favorite_animal: 'Magellanic Penguin',
            ip: '77.138.49.191',
            phone: null,
            birthday: '1968-02-07T11:49:15.859Z',
            address: '1163 Wilda Grove',
            alive: false,
            location: {
                lat: -17.26576,
                lon: 48.77103
            }
        },
        {
            _key: '8bcb1b23-abe9-43c1-a674-041eeeb0bb94',
            name: 'Dora Gray',
            age: 35,
            ssn: '299-63-2889',
            favorite_animal: 'Yelloweye Rockfish',
            ip: null,
            phone: '(877) 585-8998',
            birthday: '1985-02-26T16:28:47.100Z',
            address: '1274 Pafi Grove',
            alive: false,
            location: {
                lat: 53.84111,
                lon: -112.22926
            }
        },
        {
            _key: '52af706e-8e50-43f5-afb2-dc9b197576b6',
            name: 'Cora Pierce',
            age: 52,
            ssn: '009-66-3204',
            favorite_animal: 'Guinea Pigs',
            ip: '8.178.225.246',
            phone: '(718) 219-7148',
            birthday: '1968-02-23T01:20:02.443Z',
            address: '540 Gurpik Drive',
            alive: false,
            location: {
                lat: 22.94301,
                lon: -3.88899
            }
        },
        {
            _key: 'ed7ffcd5-c68a-4f5c-9436-edc408591b43',
            name: 'Isabel Lucas',
            age: 55,
            ssn: '349-44-3575',
            favorite_animal: 'Zebu',
            ip: '114.220.33.207',
            phone: '(302) 414-8136',
            birthday: '1965-08-07T02:42:04.443Z',
            address: '34 Cuzsi Lane',
            alive: true,
            location: {
                lat: 6.59334,
                lon: -42.11786
            }
        },
        {
            _key: '3da0aaf5-2911-40f3-bd4c-9a253da68b3a',
            name: 'Alberta Lambert',
            age: 49,
            ssn: '399-83-9484',
            favorite_animal: 'Polar Bear',
            ip: '116.245.95.224',
            phone: '(834) 224-8103',
            birthday: '1971-11-13T17:26:21.813Z',
            address: '1475 Domfas Drive',
            alive: true,
            location: {
                lat: 29.85045,
                lon: 140.25259
            }
        },
        {
            _key: '3595c1dc-f2f2-4c45-82b2-44309aec93f7',
            name: 'Nora Barrett',
            age: 33,
            ssn: '358-08-4550',
            favorite_animal: 'Scalloped Hammerhead Shark',
            ip: '96.212.117.85',
            phone: '(413) 913-6339',
            birthday: '1987-11-22T22:24:10.233Z',
            address: '1529 Wazur Glen',
            alive: true,
            location: {
                lat: 14.7586,
                lon: -134.23912
            }
        },
        {
            _key: 'cc20c43b-bfe4-4d32-ae83-201aead938df',
            name: 'Lou Kelley',
            age: null,
            ssn: '065-79-8746',
            favorite_animal: 'Raven',
            ip: null,
            phone: '(656) 894-1209',
            birthday: '1992-01-01T06:09:00.094Z',
            address: '1896 Cido Glen',
            alive: false,
            location: {
                lat: 7.40029,
                lon: -133.87113
            }
        },
        {
            _key: 'b4c6046b-9d84-471a-abdc-55c3bb0f98e7',
            name: 'Fannie Martin',
            age: null,
            ssn: '447-54-6652',
            favorite_animal: 'Giraffe',
            ip: '60.40.246.74',
            phone: '(782) 490-2964',
            birthday: '1999-05-12T23:44:28.367Z',
            address: '1937 Hapu Highway',
            alive: false,
            location: {
                lat: -32.2827,
                lon: 10.4984
            }
        },
        {
            _key: 'ee118a6d-cd39-46eb-88cc-733ee9861e3a',
            name: 'Isabella Foster',
            age: 56,
            ssn: '310-16-8183',
            favorite_animal: 'Tarantula',
            ip: '38.126.20.34',
            phone: null,
            birthday: '1964-02-11T17:10:07.166Z',
            address: '801 Enanep Avenue',
            alive: false,
            location: {
                lat: 33.79214,
                lon: -53.28533
            }
        },
        {
            _key: 'fbf7d083-f700-4c2e-b815-20f3964e20d7',
            name: 'Ricky Matthews',
            age: 58,
            ssn: '140-49-5561',
            favorite_animal: 'Matschies Tree Kangaroo',
            ip: '196.137.67.26',
            phone: null,
            birthday: '1962-06-13T20:32:06.116Z',
            address: '1090 Misuc Center',
            alive: true,
            location: {
                lat: -62.19615,
                lon: 109.78917
            }
        },
        {
            _key: '0de4b72e-8d6b-49a6-bb6c-a449db9542c3',
            name: 'Edward Watson',
            age: 59,
            ssn: '014-04-0231',
            favorite_animal: 'Barbet',
            ip: null,
            phone: null,
            birthday: '1961-04-27T12:36:56.884Z',
            address: '1168 Gamo Terrace',
            alive: true,
            location: {
                lat: 12.93092,
                lon: 90.04253
            }
        },
        {
            _key: 'a61314e3-89d9-4e5a-87e5-5a29b8ba7bc7',
            name: 'Beatrice Chambers',
            age: 35,
            ssn: '193-65-9290',
            favorite_animal: 'Gerbil',
            ip: '8.159.240.253',
            phone: '(358) 501-7573',
            birthday: '1985-02-17T21:25:47.998Z',
            address: '1229 Nueg Ridge',
            alive: false,
            location: {
                lat: 5.65506,
                lon: -25.62863
            }
        },
        {
            _key: 'a593dc68-25f2-4ca4-895c-d76bfb4b69fc',
            name: null,
            age: 64,
            ssn: '019-22-9190',
            favorite_animal: 'Ant',
            ip: '145.235.147.47',
            phone: '(640) 279-8108',
            birthday: '1956-11-21T14:03:17.105Z',
            address: '1478 Modca Trail',
            alive: false,
            location: {
                lat: 33.6387,
                lon: 128.97845
            }
        },
        {
            _key: '07abc5f8-9eff-485a-8709-2437c2faf0e6',
            name: 'Randall Yates',
            age: 60,
            ssn: '237-27-1541',
            favorite_animal: 'Bushshrike',
            ip: '157.160.119.19',
            phone: '(829) 962-9630',
            birthday: '1960-08-05T14:32:14.079Z',
            address: '1240 Zuro Parkway',
            alive: false,
            location: {
                lat: 85.70829,
                lon: 119.28935
            }
        },
        {
            _key: 'fb658de3-694f-4a7e-b4ed-2bce7eedfd0c',
            name: null,
            age: 33,
            ssn: '073-56-4913',
            favorite_animal: 'American Alligator',
            ip: '88.132.159.163',
            phone: '(644) 973-8868',
            birthday: '1987-05-04T16:23:16.318Z',
            address: '1145 Kanu Terrace',
            alive: false,
            location: {
                lat: 89.47944,
                lon: 102.20016
            }
        },
        {
            _key: '056e1e93-5572-4c83-a2e9-1d87990d8260',
            name: 'Peter Reid',
            age: 62,
            ssn: '214-20-5225',
            favorite_animal: 'Chameleon',
            ip: null,
            phone: '(311) 553-2387',
            birthday: '1958-10-25T17:12:08.116Z',
            address: '1777 Zimizu Terrace',
            alive: false,
            location: {
                lat: -39.08813,
                lon: 39.7056
            }
        },
        {
            _key: '73ce3997-8fa9-4fcd-9e06-e42a183d3d98',
            name: 'Dean Bennett',
            age: 36,
            ssn: '689-98-4868',
            favorite_animal: 'Buffalo',
            ip: null,
            phone: '(412) 751-3013',
            birthday: '1984-02-18T06:44:40.651Z',
            address: '536 Gawbi Pike',
            alive: false,
            location: {
                lat: 81.4877,
                lon: 141.99107
            }
        },
        {
            _key: '47705508-eb4e-4db7-8460-4ee8e5e1e8c1',
            name: 'May Bennett',
            age: 55,
            ssn: '180-66-2307',
            favorite_animal: 'Python',
            ip: '112.205.7.250',
            phone: '(431) 983-8091',
            birthday: '1965-04-29T05:33:41.705Z',
            address: '307 Fahi Ridge',
            alive: false,
            location: {
                lat: -26.95874,
                lon: -82.61149
            }
        },
        {
            _key: '63d75d9f-b2da-48fd-a209-12ea9f3b6461',
            name: 'Ryan Foster',
            age: 62,
            ssn: '192-22-5180',
            favorite_animal: 'Boer Goat',
            ip: null,
            phone: '(231) 796-5445',
            birthday: '1958-02-28T18:56:28.939Z',
            address: '772 Armep Street',
            alive: false,
            location: {
                lat: 54.19326,
                lon: 25.32341
            }
        },
        {
            _key: 'b89a3087-2f05-4a55-89f4-ebd9f6ad97e4',
            name: 'Catherine Patterson',
            age: 48,
            ssn: '757-38-0664',
            favorite_animal: 'Fin Whale',
            ip: '184.130.49.94',
            phone: '(826) 224-9734',
            birthday: '1972-10-18T19:48:37.961Z',
            address: '118 Tewel Plaza',
            alive: true,
            location: {
                lat: 13.40116,
                lon: 98.41985
            }
        },
        {
            _key: 'a7028773-ce2c-4eff-81e3-7804856771bc',
            name: 'Bryan Hoffman',
            age: 61,
            ssn: '176-46-8941',
            favorite_animal: 'Black-footed Ferret',
            ip: '197.74.15.16',
            phone: '(278) 730-5845',
            birthday: '1959-09-27T04:42:04.337Z',
            address: '1040 Riepa Way',
            alive: true,
            location: {
                lat: 73.14139,
                lon: -176.0576
            }
        },
        {
            _key: '3423fc83-5677-4721-82e1-f2265ac102cd',
            name: 'Susan Gordon',
            age: null,
            ssn: '056-98-7106',
            favorite_animal: 'Goose',
            ip: '151.216.124.141',
            phone: '(222) 753-7381',
            birthday: '1991-01-26T16:18:25.444Z',
            address: '1276 Ziur Center',
            alive: true,
            location: {
                lat: -38.88961,
                lon: -178.73742
            }
        },
        {
            _key: 'eedfb6ca-a36b-446d-b564-4f631093ffde',
            name: 'Bernard Greene',
            age: 51,
            ssn: '261-60-2965',
            favorite_animal: 'Dinosaur',
            ip: null,
            phone: '(661) 706-1537',
            birthday: '1969-05-03T05:55:19.119Z',
            address: '789 Wegod Avenue',
            alive: true,
            location: {
                lat: -47.76809,
                lon: 118.1454
            }
        },
        {
            _key: '804c42f5-28bc-435b-a2d9-f53c0ac87b04',
            name: 'Claudia Poole',
            age: 51,
            ssn: '308-32-3337',
            favorite_animal: 'Giraffe',
            ip: '157.207.130.205',
            phone: '(821) 417-2200',
            birthday: '1969-12-30T23:14:13.222Z',
            address: '504 Cawhal Road',
            alive: false,
            location: {
                lat: 8.32291,
                lon: -93.63271
            }
        },
        {
            _key: '24ad7345-c48c-4f8d-853d-dd4a34821a62',
            name: 'Agnes Torres',
            age: 61,
            ssn: '974-00-9569',
            favorite_animal: 'Hawaiian Honeycreeper',
            ip: '158.164.125.112',
            phone: '(833) 261-5455',
            birthday: '1959-04-25T11:42:58.550Z',
            address: '781 Rusos Point',
            alive: true,
            location: {
                lat: -31.96383,
                lon: -6.32392
            }
        },
        {
            _key: '8f5c6486-19d1-42b8-9add-0265ffebd298',
            name: 'Ryan Perez',
            age: 47,
            ssn: '459-78-1905',
            favorite_animal: 'Cow',
            ip: '187.121.222.96',
            phone: '(833) 974-1895',
            birthday: '1973-12-26T02:31:11.465Z',
            address: '1596 Osvov Place',
            alive: true,
            location: {
                lat: 13.45208,
                lon: 159.67762
            }
        },
        {
            _key: '715cb8a5-aa56-47b8-8c08-8f72899c5909',
            name: null,
            age: null,
            ssn: '923-67-3385',
            favorite_animal: 'Armadillo',
            ip: '148.244.85.57',
            phone: '(640) 545-5985',
            birthday: '1995-08-29T17:58:53.781Z',
            address: '727 Basber Mill',
            alive: false,
            location: {
                lat: -20.99206,
                lon: 37.05925
            }
        },
        {
            _key: '96777885-a703-4e0d-b7bb-2a5e987e03c5',
            name: 'Alta Soto',
            age: 40,
            ssn: '957-53-5214',
            favorite_animal: 'Kangaroo Rat',
            ip: '15.109.167.252',
            phone: '(422) 554-5170',
            birthday: '1980-11-01T06:44:30.291Z',
            address: '1540 Fime Glen',
            alive: true,
            location: {
                lat: 21.48213,
                lon: 133.14791
            }
        },
        {
            _key: '4a595e94-73ee-4448-bcc2-41961049cf62',
            name: 'Matthew Bates',
            age: 31,
            ssn: '674-85-5489',
            favorite_animal: 'Cougar',
            ip: null,
            phone: '(720) 512-7169',
            birthday: '1989-11-24T00:34:10.528Z',
            address: '1830 Noga Drive',
            alive: false,
            location: {
                lat: -16.94814,
                lon: -94.41538
            }
        },
        {
            _key: '90af7c88-2268-4977-adc9-9514c547f0dd',
            name: 'Lola Stanley',
            age: 30,
            ssn: '711-32-0556',
            favorite_animal: 'Rhea',
            ip: '10.237.221.240',
            phone: '(882) 387-7232',
            birthday: '1990-06-10T06:57:02.139Z',
            address: '345 Kovfu Way',
            alive: true,
            location: {
                lat: -19.41915,
                lon: -91.09389
            }
        },
        {
            _key: '9b2be3ba-4042-42f6-9197-b84fa3e98a35',
            name: 'Henry Rodriguez',
            age: 52,
            ssn: '423-03-2247',
            favorite_animal: 'Pheasant',
            ip: null,
            phone: '(480) 262-4394',
            birthday: '1968-08-22T12:29:36.022Z',
            address: '210 Helap Way',
            alive: false,
            location: {
                lat: -36.39675,
                lon: 164.97213
            }
        },
        {
            _key: '7ff00ba4-99f3-4e18-8598-a38c89b84d86',
            name: 'Lillie Huff',
            age: 18,
            ssn: '632-24-1347',
            favorite_animal: 'Bison',
            ip: '76.169.159.245',
            phone: '(726) 861-6453',
            birthday: '2002-03-19T07:15:35.201Z',
            address: '60 Ruvu Path',
            alive: true,
            location: {
                lat: -38.75327,
                lon: 44.2615
            }
        },
        {
            _key: '52e5c92e-7e9d-4532-8961-a2028c0bfd3b',
            name: null,
            age: 44,
            ssn: '608-24-9590',
            favorite_animal: 'Emu',
            ip: '130.171.218.177',
            phone: '(643) 544-5815',
            birthday: '1976-04-11T04:29:02.927Z',
            address: '1970 Oromuj Center',
            alive: true,
            location: {
                lat: -31.50124,
                lon: 83.87316
            }
        },
        {
            _key: '3ac89855-274a-496b-8cc2-067cc3e13a0e',
            name: 'Gussie Ross',
            age: 51,
            ssn: '091-45-1978',
            favorite_animal: 'Civet',
            ip: '141.140.232.174',
            phone: '(621) 244-1255',
            birthday: '1969-02-14T06:08:28.003Z',
            address: '1257 Setmag Pass',
            alive: false,
            location: {
                lat: 8.84104,
                lon: -138.28152
            }
        },
        {
            _key: 'f3ea58ae-bb1c-4ebd-bad9-0e98d421a0b5',
            name: 'Susie Bennett',
            age: 48,
            ssn: '949-46-0305',
            favorite_animal: 'Goose',
            ip: '118.161.214.73',
            phone: '(932) 514-2717',
            birthday: '1972-11-03T05:46:52.979Z',
            address: '218 Vanke Drive',
            alive: false,
            location: {
                lat: 78.49971,
                lon: -22.50557
            }
        },
        {
            _key: '79ae2b5a-5246-4656-80fb-f4b615345de6',
            name: 'Nellie Thompson',
            age: null,
            ssn: '773-68-7576',
            favorite_animal: 'Macaw',
            ip: '149.100.42.32',
            phone: '(831) 288-1566',
            birthday: '1991-03-16T13:09:51.246Z',
            address: '1378 Woczi Parkway',
            alive: false,
            location: {
                lat: 78.26525,
                lon: 22.0315
            }
        },
        {
            _key: '093d1c8f-85d8-4cad-84a5-a73de34e7de6',
            name: null,
            age: null,
            ssn: '921-99-8957',
            favorite_animal: 'Ferrets',
            ip: '66.250.140.236',
            phone: '(326) 940-6516',
            birthday: '1999-09-11T06:50:29.973Z',
            address: '738 Mivuj River',
            alive: true,
            location: {
                lat: -28.23442,
                lon: 30.88737
            }
        },
        {
            _key: 'bb67da0e-c74c-4f34-babd-8cf5f2b438d1',
            name: 'Andrew Hughes',
            age: 39,
            ssn: '675-30-3502',
            favorite_animal: 'Threespot Damselfish',
            ip: '160.245.220.158',
            phone: '(739) 431-9941',
            birthday: '1981-02-19T01:22:49.075Z',
            address: '1455 Dijmu Plaza',
            alive: false,
            location: {
                lat: -59.26605,
                lon: 178.29253
            }
        },
        {
            _key: '3bfdd7b6-8e3e-4315-88ac-995e1fff791a',
            name: 'Alex Duncan',
            age: null,
            ssn: '220-73-2843',
            favorite_animal: 'Zebra',
            ip: '163.59.88.216',
            phone: '(227) 530-6392',
            birthday: '1995-01-16T19:27:42.074Z',
            address: '1731 Jamaw Road',
            alive: false,
            location: {
                lat: -66.7967,
                lon: -26.19993
            }
        },
        {
            _key: '199acd15-fa9d-422f-94d2-135df094e383',
            name: 'Elsie Baker',
            age: 62,
            ssn: '813-04-3734',
            favorite_animal: 'Hyrax',
            ip: '95.24.214.230',
            phone: null,
            birthday: '1958-09-01T17:14:53.056Z',
            address: '628 Looge Pike',
            alive: false,
            location: {
                lat: 28.56776,
                lon: 161.82867
            }
        },
        {
            _key: 'e538e9a4-c8d6-496f-b620-7923a2c0ce61',
            name: 'Danny Montgomery',
            age: 38,
            ssn: '299-13-8772',
            favorite_animal: 'Clouded Leopard',
            ip: '38.206.171.178',
            phone: '(884) 599-5829',
            birthday: '1982-03-21T07:55:17.901Z',
            address: '1393 Hasuk View',
            alive: true,
            location: {
                lat: 55.7397,
                lon: -56.08811
            }
        },
        {
            _key: '6960ba55-2747-4c45-a3d7-b71fb830e3f6',
            name: 'Samuel Perez',
            age: 46,
            ssn: '472-96-4687',
            favorite_animal: 'Otter',
            ip: null,
            phone: '(206) 648-9485',
            birthday: '1974-09-30T11:59:45.982Z',
            address: '1656 Zuew Lane',
            alive: true,
            location: {
                lat: -73.76929,
                lon: 74.87966
            }
        },
        {
            _key: '0f613454-3e49-4933-bd6f-18457ea510f9',
            name: 'Mattie Lawson',
            age: 65,
            ssn: '317-58-9790',
            favorite_animal: 'Lionfish',
            ip: '34.107.175.93',
            phone: '(683) 705-6135',
            birthday: '1955-09-18T09:42:57.425Z',
            address: '288 Sowwu Place',
            alive: false,
            location: {
                lat: 13.36743,
                lon: 31.78819
            }
        },
        {
            _key: '918f67ca-e3de-4758-9d22-c3362226afe6',
            name: 'Emily Larson',
            age: 64,
            ssn: '116-58-8661',
            favorite_animal: 'Squirrel',
            ip: null,
            phone: '(731) 842-2492',
            birthday: '1956-07-07T00:22:33.328Z',
            address: '1417 Fabik Mill',
            alive: false,
            location: {
                lat: 80.41833,
                lon: 39.00269
            }
        },
        {
            _key: 'e2094214-75f6-414c-b88d-96bd71710215',
            name: null,
            age: 33,
            ssn: '058-14-4911',
            favorite_animal: 'Hawk',
            ip: '140.4.24.229',
            phone: '(975) 353-4515',
            birthday: '1987-05-21T17:51:31.565Z',
            address: '1262 Ubupok Loop',
            alive: true,
            location: {
                lat: 39.31332,
                lon: -76.11572
            }
        },
        {
            _key: 'dc6205da-e7f3-4538-b094-36dca24c66c5',
            name: 'Alvin Ramos',
            age: 44,
            ssn: '283-52-6837',
            favorite_animal: 'Tasseled Wobbegong',
            ip: '84.182.43.192',
            phone: '(338) 757-5802',
            birthday: '1976-07-11T10:44:29.850Z',
            address: '506 Molon Pike',
            alive: false,
            location: {
                lat: -79.16075,
                lon: -137.36905
            }
        },
        {
            _key: '1e414961-c691-4237-88e9-8a093f21b5df',
            name: null,
            age: 55,
            ssn: '575-33-4687',
            favorite_animal: 'Culpeo',
            ip: '72.184.44.203',
            phone: '(370) 319-2344',
            birthday: '1965-10-17T06:53:14.844Z',
            address: '1938 Imajo Court',
            alive: true,
            location: {
                lat: -89.49291,
                lon: 136.65289
            }
        },
        {
            _key: 'ed448b3b-90cb-4143-9afe-c2857cf7b0c6',
            name: 'Elsie Torres',
            age: 35,
            ssn: '237-35-2591',
            favorite_animal: 'Grey Atlantic Seal',
            ip: '106.146.80.25',
            phone: '(780) 662-5989',
            birthday: '1985-11-18T12:02:26.744Z',
            address: '850 Ohzuz Point',
            alive: false,
            location: {
                lat: 16.88776,
                lon: 15.82189
            }
        },
        {
            _key: 'ea7e2504-f74a-4f5c-89b8-83841f20b880',
            name: 'Christopher Brock',
            age: 19,
            ssn: '817-10-1266',
            favorite_animal: 'Gayal',
            ip: null,
            phone: null,
            birthday: '2001-08-25T13:00:09.860Z',
            address: '496 Zulmor Path',
            alive: true,
            location: {
                lat: 8.86757,
                lon: -60.04928
            }
        },
        {
            _key: 'e70d9702-280d-44d3-b1db-80d92b62f422',
            name: 'Marie Buchanan',
            age: 46,
            ssn: '248-18-6209',
            favorite_animal: 'Banteng',
            ip: '79.97.187.82',
            phone: '(957) 593-1075',
            birthday: '1974-06-26T16:51:34.348Z',
            address: '1794 Zelur Way',
            alive: false,
            location: {
                lat: -10.20439,
                lon: 140.80834
            }
        },
        {
            _key: '8028d26f-4aed-465a-832b-9e626a893199',
            name: 'Mildred Cain',
            age: 35,
            ssn: '110-62-8168',
            favorite_animal: 'Sandbar Shark',
            ip: '55.209.179.108',
            phone: '(655) 229-1290',
            birthday: '1985-03-11T06:38:48.581Z',
            address: '1975 Jokis Place',
            alive: false,
            location: {
                lat: 10.42867,
                lon: 14.65411
            }
        },
        {
            _key: '75b65c1f-cfa7-4218-bb8d-a9cab9c1a142',
            name: 'Leo Norris',
            age: 43,
            ssn: '217-64-1975',
            favorite_animal: 'Owl',
            ip: null,
            phone: '(951) 834-2319',
            birthday: '1977-12-13T21:34:39.820Z',
            address: '1318 Huvo Highway',
            alive: true,
            location: {
                lat: 31.69856,
                lon: 25.71368
            }
        },
        {
            _key: 'd6cdc71b-242b-423a-a166-e8d895eb6b94',
            name: 'Walter Stephens',
            age: 48,
            ssn: '603-03-5972',
            favorite_animal: 'Horses',
            ip: '149.98.33.7',
            phone: null,
            birthday: '1972-02-20T04:53:49.391Z',
            address: '1235 Rijhu Street',
            alive: false,
            location: {
                lat: -38.80412,
                lon: 124.40779
            }
        },
        {
            _key: '24c3dc27-5dac-4690-8ac5-7afe101c1de3',
            name: 'Rebecca Burton',
            age: 19,
            ssn: '095-70-2970',
            favorite_animal: 'Marrus Orthocanna',
            ip: '35.107.248.18',
            phone: '(240) 312-1194',
            birthday: '2001-01-16T10:23:36.487Z',
            address: '1456 Nopan Circle',
            alive: true,
            location: {
                lat: 36.45575,
                lon: -83.64726
            }
        },
        {
            _key: '6c24a27d-1300-4357-9b51-86a475b12bac',
            name: 'Gary Frazier',
            age: 54,
            ssn: '502-45-3469',
            favorite_animal: 'Trogon',
            ip: null,
            phone: '(405) 227-8272',
            birthday: '1966-04-21T06:01:34.813Z',
            address: '348 Surew Center',
            alive: true,
            location: {
                lat: -10.06179,
                lon: -5.10761
            }
        },
        {
            _key: '9ac25e2e-4ef7-472f-81e4-7dca65c8de7b',
            name: 'Matilda Marshall',
            age: 19,
            ssn: '538-76-4437',
            favorite_animal: 'Starfish',
            ip: '136.72.241.61',
            phone: '(424) 884-4082',
            birthday: '2001-07-15T15:36:21.713Z',
            address: '864 Jiwnu Grove',
            alive: false,
            location: {
                lat: -66.80313,
                lon: 1.91599
            }
        },
        {
            _key: '18c66b1c-47f2-4714-ac2a-485c16d68de3',
            name: 'Ruby Wade',
            age: 55,
            ssn: '722-46-2771',
            favorite_animal: 'Cat',
            ip: null,
            phone: '(439) 391-6476',
            birthday: '1965-08-06T21:27:52.340Z',
            address: '1025 Noki Place',
            alive: true,
            location: {
                lat: -89.91374,
                lon: -103.03759
            }
        },
        {
            _key: 'c700d414-64d1-41b6-b900-454c736f4699',
            name: 'Lloyd Norton',
            age: 18,
            ssn: '639-94-9940',
            favorite_animal: 'Camel',
            ip: '97.195.105.254',
            phone: '(832) 664-8785',
            birthday: '2002-06-01T21:26:57.919Z',
            address: '707 Kodoj Avenue',
            alive: false,
            location: {
                lat: 63.76428,
                lon: 164.45428
            }
        },
        {
            _key: '3c02cc1e-3427-476e-a15f-2324492b9b3b',
            name: 'Aiden Morton',
            age: 59,
            ssn: '657-78-9141',
            favorite_animal: 'American Bison',
            ip: '72.242.17.155',
            phone: '(866) 813-8725',
            birthday: '1961-04-28T16:49:52.603Z',
            address: '225 Avpa Place',
            alive: false,
            location: {
                lat: 7.55542,
                lon: 48.921
            }
        },
        {
            _key: 'd234e8c6-0434-4158-b9e9-8cfa84817131',
            name: null,
            age: null,
            ssn: '912-88-5435',
            favorite_animal: 'Guanaco',
            ip: '60.165.231.141',
            phone: null,
            birthday: '1991-05-05T21:23:52.509Z',
            address: '872 Ukabef River',
            alive: false,
            location: {
                lat: 57.33842,
                lon: -39.90026
            }
        },
        {
            _key: 'f6481bb5-4dda-48b3-ada0-bb6b63498261',
            name: 'Mina Fletcher',
            age: 18,
            ssn: '797-84-8139',
            favorite_animal: 'Tiger Prawn',
            ip: '84.166.166.40',
            phone: null,
            birthday: '2002-06-19T00:55:40.977Z',
            address: '1695 Cuwtoj Trail',
            alive: true,
            location: {
                lat: -70.97018,
                lon: 147.38878
            }
        },
        {
            _key: '282e8ede-c466-4bcd-af1a-ba2e44849b53',
            name: 'Austin Meyer',
            age: 33,
            ssn: '382-30-5176',
            favorite_animal: 'Flameback',
            ip: '190.94.202.36',
            phone: '(453) 731-6562',
            birthday: '1987-02-25T20:43:22.141Z',
            address: '829 Vufgof Glen',
            alive: true,
            location: {
                lat: 1.33971,
                lon: -134.70661
            }
        },
        {
            _key: '8dc8f945-8bd9-420e-816f-922761b85116',
            name: null,
            age: 62,
            ssn: '443-28-8120',
            favorite_animal: 'Flea',
            ip: '190.46.51.101',
            phone: '(750) 494-9978',
            birthday: '1958-07-18T19:47:25.723Z',
            address: '433 Uloho Mill',
            alive: false,
            location: {
                lat: 50.33839,
                lon: 34.98428
            }
        },
        {
            _key: 'd4cfac32-2417-491e-adc8-463112435a23',
            name: 'Eleanor Bush',
            age: 43,
            ssn: '811-14-8139',
            favorite_animal: 'Lionfish',
            ip: '198.79.166.51',
            phone: '(476) 262-5027',
            birthday: '1977-04-16T22:10:29.277Z',
            address: '1042 Obehav Lane',
            alive: false,
            location: {
                lat: 15.86942,
                lon: -57.78992
            }
        },
        {
            _key: 'ac1cbe06-b2c4-4393-9046-90a20f2c7c1e',
            name: 'Sean Estrada',
            age: 18,
            ssn: '822-15-7350',
            favorite_animal: 'Rats',
            ip: null,
            phone: null,
            birthday: '2002-04-04T02:28:58.995Z',
            address: '102 Gegga Center',
            alive: false,
            location: {
                lat: -29.34294,
                lon: 1.29855
            }
        },
        {
            _key: '3ab0ed29-0f21-47cb-a5eb-8d12175bfa71',
            name: 'Terry Baker',
            age: 55,
            ssn: '131-34-0007',
            favorite_animal: 'Pot Bellied Pig',
            ip: '169.111.225.10',
            phone: '(463) 447-7621',
            birthday: '1965-10-19T19:15:19.845Z',
            address: '1472 Ziep Pass',
            alive: false,
            location: {
                lat: -62.51105,
                lon: 132.2285
            }
        },
        {
            _key: '82e372f1-5560-4ea3-b2cb-d7864fc23d13',
            name: 'Kyle Walters',
            age: 65,
            ssn: '961-82-6947',
            favorite_animal: 'Dog',
            ip: null,
            phone: '(374) 346-9300',
            birthday: '1955-06-15T19:30:45.569Z',
            address: '1660 Roica Point',
            alive: true,
            location: {
                lat: -28.56519,
                lon: 110.12842
            }
        },
        {
            _key: '99ae25e5-e0c7-45c5-ae0c-29c13bd89bee',
            name: 'Bettie Long',
            age: 55,
            ssn: '524-72-0923',
            favorite_animal: 'Chicken',
            ip: '46.236.109.209',
            phone: '(851) 513-4214',
            birthday: '1965-03-22T03:57:21.858Z',
            address: '1705 Nadna Pass',
            alive: false,
            location: {
                lat: 43.00819,
                lon: -36.3984
            }
        },
        {
            _key: '40e255b5-6abc-4388-b3ae-28aee61f9b9a',
            name: 'Nancy Klein',
            age: 31,
            ssn: '758-37-7261',
            favorite_animal: 'Donkey',
            ip: '14.191.201.2',
            phone: '(317) 345-3981',
            birthday: '1989-12-21T18:09:03.794Z',
            address: '367 Riccob Boulevard',
            alive: true,
            location: {
                lat: 39.58438,
                lon: -15.7705
            }
        },
        {
            _key: 'c91c6be0-9363-4ff6-9294-f247c631c6ac',
            name: 'Mable Bush',
            age: 53,
            ssn: '570-37-4783',
            favorite_animal: 'Ring-tailed Mongoose',
            ip: null,
            phone: '(728) 802-1299',
            birthday: '1967-10-20T19:39:12.435Z',
            address: '76 Vovjis Boulevard',
            alive: true,
            location: {
                lat: -44.71868,
                lon: 115.62564
            }
        },
        {
            _key: 'bfd0f4d5-004d-4a26-9eb3-841ec26325b4',
            name: 'Alan Ortega',
            age: 54,
            ssn: '028-00-5501',
            favorite_animal: 'Silkworm',
            ip: '104.43.103.86',
            phone: '(441) 473-7775',
            birthday: '1966-05-20T03:46:05.304Z',
            address: '930 Didzom Extension',
            alive: false,
            location: {
                lat: -70.63825,
                lon: 159.87638
            }
        },
        {
            _key: '0358665e-cf50-4d7d-9109-a7d7eaa0bdcd',
            name: 'Darrell Logan',
            age: null,
            ssn: '013-36-4712',
            favorite_animal: 'Duck',
            ip: '80.147.7.88',
            phone: '(727) 544-7804',
            birthday: '1991-09-27T06:33:49.892Z',
            address: '1504 Nizlij Park',
            alive: false,
            location: {
                lat: 72.56322,
                lon: 40.47314
            }
        },
        {
            _key: 'ba40604b-ce24-4e4d-923e-de0f233037ae',
            name: 'Herman Hubbard',
            age: 35,
            ssn: '018-78-9108',
            favorite_animal: 'Pigeon',
            ip: '111.74.198.196',
            phone: '(776) 260-3465',
            birthday: '1985-02-20T03:30:06.592Z',
            address: '965 Kukpi Point',
            alive: false,
            location: {
                lat: 51.66871,
                lon: -144.52172
            }
        },
        {
            _key: 'a8bf2330-d1db-4991-b08b-fac41c76bf48',
            name: null,
            age: null,
            ssn: '177-63-3746',
            favorite_animal: 'Turkeys',
            ip: null,
            phone: '(772) 470-2306',
            birthday: '1996-03-31T18:03:13.402Z',
            address: '845 Ruluf Plaza',
            alive: false,
            location: {
                lat: 87.68803,
                lon: -145.93186
            }
        },
        {
            _key: '87daa93c-c5e3-46eb-a9f0-bb371acb1eba',
            name: 'Frank Lowe',
            age: 42,
            ssn: '419-63-1351',
            favorite_animal: 'Sheep',
            ip: '19.247.8.134',
            phone: '(323) 896-9541',
            birthday: '1978-04-05T19:47:25.843Z',
            address: '1720 Dole Key',
            alive: false,
            location: {
                lat: 13.59795,
                lon: 77.29696
            }
        }
    ]

};
