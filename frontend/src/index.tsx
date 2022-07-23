import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './components/App';
import Login from './components/Login';
import Logout from './components/Logout';
import NavbarRoot from './components/Navbar/NavbarRoot';
import SalesTable from './components/SalesTable';
import appTheme from './themes/appTheme';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={appTheme}>
                <SnackbarProvider autoHideDuration={1000} maxSnack={3}>
                    <CssBaseline enableColorScheme />
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<App />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/logout" element={<Logout />} />
                            <Route
                                path="/salesTable"
                                element={
                                    <>
                                        <NavbarRoot />
                                        <SalesTable token={null} />
                                    </>
                                }
                            />
                        </Routes>
                    </BrowserRouter>
                </SnackbarProvider>
            </ThemeProvider>
        </LocalizationProvider>
    </React.StrictMode>
);
