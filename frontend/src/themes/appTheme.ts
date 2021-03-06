import { createTheme } from '@mui/material';
import type {} from '@mui/x-date-pickers/themeAugmentation';

const appTheme = createTheme({
    components: {
        MuiDialogContent: {
            styleOverrides: { root: { paddingTop: `1.2em !important` } },
        },
        MuiDatePicker: {
            styleOverrides: {
                root: {
                    backgroundColor: 'red',
                },
            },
        },
    },
});
export default appTheme;
