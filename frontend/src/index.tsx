import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import appTheme from './themes/appTheme';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={appTheme}>
            <CssBaseline enableColorScheme />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
