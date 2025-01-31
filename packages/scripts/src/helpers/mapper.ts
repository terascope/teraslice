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
    const kafkaMapper: Record<number, Record<number, string>> = {
        3: {
            0: '7.0.16',
            1: '7.1.15',
            2: '7.2.13',
            3: '7.3.11',
            4: '7.4.8',
            5: '7.5.7',
            6: '7.6.4',
            7: '7.7.2',
            8: '7.8.0'
        },
        2: {
            4: '5.4.10',
            5: '5.5.12',
            6: '6.0.15',
            7: '6.1.15',
            8: '6.2.15'
        }
    };

    const major = Number(kafkaVersion.charAt(0));
    const minor = Number(kafkaVersion.charAt(2));

    const cpKafkaVersion = kafkaMapper[major][minor];
    if (!cpKafkaVersion) {
        throw new Error(`Kafka version ${kafkaVersion} could not be mapped to cp-kafka version. Supported version are ${errMsgVersionStringBuilder(kafkaMapper)}.`);
    }
    return cpKafkaVersion;
}

function errMsgVersionStringBuilder(map: Record<number, Record<number, string>>) {
    const msgsArr: string[] = [];
    for (const major in map) {
        if (Object.prototype.hasOwnProperty.call(map, major)) {
            const minors = Object.keys(map[major]);
            msgsArr.push(`${major}.${minors[0]}-${major}.${minors[minors.length - 1]}`);
        }
    }
    return msgsArr.join(', ');
}
