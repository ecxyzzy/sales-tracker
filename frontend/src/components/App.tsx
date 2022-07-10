import { CssBaseline, ThemeProvider } from '@mui/material';
import appTheme from '../themes/appTheme';
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function App() {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return (
        <ThemeProvider theme={appTheme}>
            <CssBaseline enableColorScheme />
            <h1>Application</h1>
        </ThemeProvider>
    );
}
