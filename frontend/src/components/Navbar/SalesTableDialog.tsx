import React, { useEffect, useState } from 'react';
import DataThresholdingIcon from '@mui/icons-material/DataThresholding';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Link } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function SalesTableDialog() {
    const [open, setOpen] = useState(false);
    const [fromDate, setFromDate] = useState<Date | null>(new Date());
    const [toDate, setToDate] = useState<Date | null>(new Date());
    const [disabled, setDisabled] = useState(true);
    useEffect(() => {
        setFromDate(new Date());
        setToDate(new Date());
    }, [open]);
    useEffect(() => {
        setDisabled(isNaN(fromDate?.getTime() ?? NaN) || isNaN(toDate?.getTime() ?? NaN));
    }, [fromDate, toDate]);
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Button onClick={() => setOpen(true)} color="inherit" startIcon={<DataThresholdingIcon />}>
                Sales Table
            </Button>
            <Dialog open={open}>
                <DialogTitle>Show results</DialogTitle>
                <DialogContent>
                    <div>
                        <DatePicker
                            onChange={(newValue) => {
                                setFromDate(newValue);
                            }}
                            renderInput={(params: JSX.IntrinsicAttributes) => <TextField {...params} />}
                            disableFuture={true}
                            inputFormat="yyyy/MM/dd"
                            label="From"
                            value={fromDate}
                        />
                    </div>
                    <br />
                    <div>
                        <DatePicker
                            onChange={(newValue) => {
                                setToDate(newValue);
                            }}
                            renderInput={(params: JSX.IntrinsicAttributes) => <TextField {...params} />}
                            disableFuture={true}
                            inputFormat="yyyy/MM/dd"
                            label="To"
                            value={toDate}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button
                        component={Link}
                        to={`/salesTable?fromDate=${fromDate?.toISOString().split('T')[0]}&toDate=${
                            toDate?.toISOString().split('T')[0]
                        }`}
                        color="primary"
                        disabled={disabled}
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
