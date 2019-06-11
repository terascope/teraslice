type DropdownOption = {
    key: string;
    text: string;
    value: string;
    disabled?: boolean;
};

export function getFieldOptions(available: string[] = []) {
    const options: DropdownOption[] = [];
    for (const field of available) {
        if (!field) continue;

        const parts: string[] = [];
        for (const _part of field.trim().split('.')) {
            const part = _part.trim();
            if (!part) continue;
            parts.push(part);

            const path = parts.join('.');
            if (options.some(({ key }) => key === path)) continue;
            options.push({
                key: path,
                text: path,
                value: path,
            });
        }
    }
    return options;
}
