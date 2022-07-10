import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';
import {
    ErrorResponse,
    isErrorResponse,
    ProductsGetResponse,
    SanitizedTransaction,
    TransactionsGetResponse,
    UsersGetResponse,
} from '../types';

const dateFmt = new Intl.DateTimeFormat();
const columns: GridColDef[] = [
    {
        field: 'transactionDate',
        headerName: 'Date',
        valueFormatter: (params) => dateFmt.format(new Date(params.value)),
    },
    {
        field: 'product',
        headerName: 'Product',
    },
    {
        field: 'transactionCount',
        headerName: 'Count',
    },
    {
        field: 'price',
        headerName: 'Price',
    },
    {
        field: 'estimatedTotal',
        headerName: 'Estimated total',
    },
    {
        field: 'actualTotal',
        headerName: 'Actual total',
    },
    {
        field: 'handler1',
        headerName: 'Handler 1',
    },
    {
        field: 'handler2',
        headerName: 'Handler 2',
    },
    {
        field: 'handler3',
        headerName: 'Handler 3',
    },
    {
        field: 'remarks',
        headerName: 'Remarks',
    },
];

export default function SalesTable(props: { token: string | null }) {
    const [rows, setRows] = useState<SanitizedTransaction[]>([]);
    const [error, setError] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchData() {
            const tRes = (await (
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/transactions/get`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${props.token}`,
                        'Content-Type': 'application/json',
                    },
                })
            ).json()) as ErrorResponse | TransactionsGetResponse;
            if (isErrorResponse(tRes)) {
                console.error(`Error: Failed to retrieve transactions (${tRes.status} ${tRes.error}: ${tRes.message})`);
                setError(true);
                return;
            }
            const pRes = (await (
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/products/get`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${props.token}`,
                        'Content-Type': 'application/json',
                    },
                })
            ).json()) as ErrorResponse | ProductsGetResponse;
            if (isErrorResponse(pRes)) {
                console.error(`Error: Failed to retrieve products (${pRes.status} ${pRes.error}: ${pRes.message})`);
                setError(true);
                return;
            }
            const uRes = (await (
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/get`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${props.token}`,
                        'Content-Type': 'application/json',
                    },
                })
            ).json()) as ErrorResponse | UsersGetResponse;
            if (isErrorResponse(uRes)) {
                console.error(`Error: Failed to retrieve users (${uRes.status} ${uRes.error}: ${uRes.message})`);
                setError(true);
                return;
            }
            setRows([]);
            for (const transaction of tRes.payload) {
                setRows((prevState) => [
                    ...prevState,
                    {
                        ...transaction,
                        product: pRes.payload.filter((x) => x.pid === transaction.product)[0].productName,
                        handler1: uRes.payload.filter((x) => x.uid === transaction.handler1)[0].username,
                        handler2: uRes.payload.filter((x) => x.uid === transaction?.handler2)[0]?.username,
                        handler3: uRes.payload.filter((x) => x.uid === transaction?.handler3)[0]?.username,
                    },
                ]);
            }
            setLoading(false);
        }
        fetchData().catch((e) => {
            console.error(e);
            setError(true);
        });
    }, [props.token]);
    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid columns={columns} rows={rows} getRowId={(r) => r.tid} error={error} loading={loading} />
        </Box>
    );
}
