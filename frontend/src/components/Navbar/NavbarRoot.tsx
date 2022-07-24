import { AppBar, Container, Toolbar } from '@mui/material';
import React from 'react';

import SalesTableDialog from './SalesTableDialog';

export default function NavbarRoot() {
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <SalesTableDialog />
                </Toolbar>
            </Container>
        </AppBar>
    )
}
