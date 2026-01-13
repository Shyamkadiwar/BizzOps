import React from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarExport } from '@mui/x-data-grid';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';

export default function ProfessionalDataGrid({
    rows,
    columns,
    loading = false,
    onAdd,
    onExport,
    onImport,
    pageSize = 10,
    checkboxSelection = false,
    title = ''
}) {
    const CustomToolbar = () => {
        return (
            <GridToolbarContainer sx={{ p: 1, gap: 1 }}>
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                <GridToolbarExport />

                {onExport && (
                    <Tooltip title="Export to Excel">
                        <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={onExport}
                        >
                            Export Excel
                        </Button>
                    </Tooltip>
                )}

                {onImport && (
                    <Tooltip title="Import from Excel">
                        <Button
                            size="small"
                            startIcon={<UploadIcon />}
                            onClick={onImport}
                        >
                            Import Excel
                        </Button>
                    </Tooltip>
                )}

                {onAdd && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                        sx={{ ml: 'auto' }}
                    >
                        Add New
                    </Button>
                )}
            </GridToolbarContainer>
        );
    };

    return (
        <Box sx={{ height: 650, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: pageSize, page: 0 },
                    },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection={checkboxSelection}
                disableRowSelectionOnClick
                loading={loading}
                slots={{
                    toolbar: CustomToolbar,
                }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                    },
                }}
                sx={{
                    '& .MuiDataGrid-toolbarContainer': {
                        padding: '8px',
                        gap: '8px',
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: '#fafafa',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f5f5f5',
                        borderBottom: '2px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-footerContainer': {
                        borderTop: '2px solid #e0e0e0',
                    },
                }}
            />
        </Box>
    );
}
