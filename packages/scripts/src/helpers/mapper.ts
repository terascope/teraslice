/**
 * This function maps a kafka version to the equivalent version of confluent/cp-kafka,
 * which is the kafka docker image currently used in teraslice.
 * The kafka version should include the major and minor versions, but not the patch version.
 * Ref: https://docs.confluent.io/platform/current/installation/versions-interoperability.html#cp-and-apache-ak-compatibility
*/
export function kafkaVersionMapper(kafkaVersion: string): string {
    const regex = /(0|[1-9]\d*)\.(0|[1-9]\d*)/;
    if (!regex.test(kafkaVersion)) {
        throw new Error('Kafka version must contain major and minor semver version, but omit patch version.');
    }
    const kafkaMapper = {
        3: {
            0: '7.0.11',
            1: '7.1.9',
            2: '7.2.7',
            3: '7.3.5',
            4: '7.4.2',
            5: '7.5.1'
        },
        2: {
            4: '5.4.10',
            5: '5.5.12',
            6: '6.0.15',
            7: '6.1.13',
            8: '6.2.12'
        }
    };

    const cpKafkaVersion = kafkaMapper[kafkaVersion.charAt(0)][kafkaVersion.charAt(2)];
    if (!cpKafkaVersion) {
        throw new Error(`Kafka version ${kafkaVersion} could not be mapped to cp-kafka version. Supported version are ${errMsgVersionStringBuilder(kafkaMapper)}.`);
    }
    return cpKafkaVersion;
}

function errMsgVersionStringBuilder(map: object) {
    const msgsArr: string[] = [];
    for (const major in map) {
        if (Object.prototype.hasOwnProperty.call(map, major)) {
            const minors = Object.keys(map[major]);
            msgsArr.push(`${major}.${minors[0]}-${major}.${minors[minors.length - 1]}`);
        }
    }
    return msgsArr.join(', ');
}
