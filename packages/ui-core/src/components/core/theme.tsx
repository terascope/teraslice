import { createMuiTheme } from '@material-ui/core';

export default createMuiTheme({
    overrides: {
        MuiFormControlLabel: {
            label: {
                lineHeight: 1
            }
        }
    },
    spacing: {
        unit: 8 // 8 is the default
    },
    typography: {
        useNextVariants: true,
    },
    palette: {
        secondary: {
            main: '#1e88e5',
        },
        primary: {
            main: '#0277bd',
        },
    }
});
