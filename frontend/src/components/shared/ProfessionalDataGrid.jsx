import React from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarExport } from '@mui/x-data-grid';
import { Box, Button, Tooltip } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';

const dataGridSx = {
    border: 'none',
    backgroundColor: 'transparent',
    '& .MuiDataGrid-columnHeaders': {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.08))',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        fontWeight: 700,
        color: '#475569',
        letterSpacing: '0.05em',
        minHeight: '44px !important',
        maxHeight: '44px !important',
    },
    '& .MuiDataGrid-columnHeader': {
        minHeight: '44px !important',
        maxHeight: '44px !important',
    },
    '& .MuiDataGrid-row': {
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
        },
        '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
        },
    },
    '& .MuiDataGrid-cell': {
        borderBottom: 'none',
        color: '#334155',
        padding: '8px 12px',
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        background: 'rgba(248, 250, 252, 0.5)',
    },
    '& .MuiDataGrid-columnSeparator': {
        display: 'none',
    },
    '& .MuiDataGrid-menuIcon': {
        visibility: 'visible',
    },
    '& .MuiDataGrid-toolbarContainer': {
        padding: '8px 12px',
        gap: '8px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        background: 'rgba(248, 250, 252, 0.5)',
    },
};

export { dataGridSx };

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
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md overflow-hidden">
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
                    sx={dataGridSx}
                />
            </Box>
        </div>
    );
}
