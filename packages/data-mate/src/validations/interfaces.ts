export interface FQDNOptions {
    requireTld?: boolean;
    allowUnderscores?: boolean;
    allowTrailingDot?: boolean;
}

export type ValidatorHashValues
    = | 'md4'
        | 'md5'
        | 'sha1'
        | 'sha256'
        | 'sha384'
        | 'sha512'
        | 'ripemd128'
        | 'ripemd160'
        | 'tiger128'
        | 'tiger160'
        | 'tiger192'
        | 'crc32'
        | 'crc32b';

export interface HashConfig {
    algo: ValidatorHashValues;
}

export interface LengthConfig {
    size?: number;
    min?: number;
    max?: number;
}

export interface ArgsISSNOptions {
    requireHyphen?: boolean;
    caseSensitive?: boolean;
}

export type PostalCodeLocale
    = | 'AD'
        | 'AT'
        | 'AU'
        | 'BE'
        | 'BG'
        | 'BR'
        | 'CA'
        | 'CH'
        | 'CZ'
        | 'DE'
        | 'DK'
        | 'DZ'
        | 'EE'
        | 'ES'
        | 'FI'
        | 'FR'
        | 'GB'
        | 'GR'
        | 'HR'
        | 'HU'
        | 'ID'
        | 'IE'
        | 'IL'
        | 'IN'
        | 'IS'
        | 'IT'
        | 'JP'
        | 'KE'
        | 'LI'
        | 'LT'
        | 'LU'
        | 'LV'
        | 'MX'
        | 'MT'
        | 'NL'
        | 'NO'
        | 'NZ'
        | 'PL'
        | 'PR'
        | 'PT'
        | 'RO'
        | 'RU'
        | 'SA'
        | 'SE'
        | 'SI'
        | 'SK'
        | 'TN'
        | 'TW'
        | 'UA'
        | 'US'
        | 'ZA'
        | 'ZM';
