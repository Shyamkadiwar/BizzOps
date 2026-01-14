import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, Paper, Chip, IconButton, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Upload as UploadIcon, Download as DownloadIcon, AddCircle, RemoveCircle } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddInventory from "./AddInventory.jsx";
import MuiModal from "../shared/MuiModal";
import Layout from "../Layout.jsx";
import InventoryAgentChat from './InventoryAgentChat.jsx';
import ConfirmDialog from "../shared/ConfirmDialog.jsx";
import PromptDialog from "../shared/PromptDialog.jsx";
import AlertDialog from "../shared/AlertDialog.jsx";

const token = localStorage.getItem('accessToken');

function Inventory() {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalInventoryValue, setTotalInventoryValue] = useState(0);
    const [openModal, setOpenModal] = useState(false);

    // Pagination state
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalCount, setTotalCount] = useState(0);

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState({ open: false, itemId: null });
    const [promptDialog, setPromptDialog] = useState({ open: false, itemId: null, adjustment: 0 });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const fetchInventory = useCallback(async (page = paginationModel.page, pageSize = paginationModel.pageSize) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item?page=${page + 1}&limit=${pageSize}`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            console.log('Inventory API Response:', response.data); // Debug log

            if (response.status === 200 && response.data && response.data.data) {
                const items = response.data.data.inventoryItems || [];
                setInventoryItems(items.map(item => ({ ...item, id: item._id })));
                setTotalInventoryValue(response.data.data.totalInventoryValue || 0);
                setTotalCount(response.data.data.pagination?.totalCount || 0);

                console.log('Total Inventory Value:', response.data.data.totalInventoryValue); // Debug log
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setAlertDialog({
                open: true,
                title: "Error",
                message: "Failed to fetch inventory items",
                severity: "error"
            });
        } finally {
            setLoading(false);
        }
    }, [paginationModel.page, paginationModel.pageSize]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleItemAdded = () => {
        setOpenModal(false);
        fetchInventory();
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            itemId: id
        });
    };

    const confirmDelete = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/delete-item`,
                { product: confirmDialog.itemId },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setAlertDialog({
                open: true,
                title: "Success",
                message: "Item deleted successfully",
                severity: "success"
            });
            fetchInventory();
        } catch (error) {
            console.error('Error deleting item:', error);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error deleting item",
                severity: "error"
            });
        }
    };

    const handleStockAdjustment = (id, adjustment) => {
        setPromptDialog({
            open: true,
            itemId: id,
            adjustment: adjustment
        });
    };

    const confirmStockAdjustment = async (quantity) => {
        const endpoint = promptDialog.adjustment > 0 ? 'add-stock' : 'remove-stock';

        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/${endpoint}`,
                { product: promptDialog.itemId, newQty: parseInt(quantity) },
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setAlertDialog({
                open: true,
                title: "Success",
                message: `Stock ${promptDialog.adjustment > 0 ? 'added' : 'removed'} successfully`,
                severity: "success"
            });
            fetchInventory();
        } catch (error) {
            console.error('Error adjusting stock:', error);
            setAlertDialog({
                open: true,
                title: "Error",
                message: error.response?.data?.message || "Error adjusting stock",
                severity: "error"
            });
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/export/inventory`,
                {
                    headers: { 'Authorization': token },
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventory.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setAlertDialog({
                open: true,
                title: "Success",
                message: "Inventory exported successfully",
                severity: "success"
            });
        } catch (error) {
            console.error('Export failed:', error);
            setAlertDialog({
                open: true,
                title: "Error",
                message: "Failed to export inventory",
                severity: "error"
            });
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/excel/import/inventory`,
                    formData,
                    {
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'multipart/form-data'
                        },
                        withCredentials: true
                    }
                );

                setAlertDialog({
                    open: true,
                    title: "Success",
                    message: `Import successful! ${response.data.data.success.length} items imported.`,
                    severity: "success"
                });
                fetchInventory();
            } catch (error) {
                console.error('Import failed:', error);
                setAlertDialog({
                    open: true,
                    title: "Error",
                    message: "Failed to import inventory",
                    severity: "error"
                });
            }
        };
        input.click();
    };

    const columns = [
        { field: 'item', headerName: 'Item', width: 150, filterable: true },
        { field: 'category', headerName: 'Category', width: 120, filterable: true },
        { field: 'warehouse', headerName: 'Warehouse', width: 120, filterable: true },
        {
            field: 'cost',
            headerName: 'Cost',
            width: 100,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'salePrice',
            headerName: 'Sale Price',
            width: 120,
            type: 'number',
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        { field: 'vendor', headerName: 'Vendor', width: 150 },
        {
            field: 'stockRemain',
            headerName: 'Stock',
            width: 100,
            type: 'number',
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value > 10 ? 'success' : params.value > 0 ? 'warning' : 'error'}
                    size="small"
                />
            )
        },
        {
            field: 'totalValue',
            headerName: 'Total Value',
            width: 120,
            type: 'number',
            valueGetter: (value, row) => (row.cost || 0) * (row.stockRemain || 0),
            valueFormatter: (value) => `₹${value?.toLocaleString() || 0}`
        },
        {
            field: 'taxes',
            headerName: 'Taxes',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value?.map((tax, idx) => (
                        <Chip key={idx} label={`${tax.name}: ${tax.rate}%`} size="small" variant="outlined" />
                    ))}
                </Box>
            )
        },
        {
            field: 'stockAdjustment',
            headerName: 'Adjust Stock',
            width: 130,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                        color="success"
                        size="small"
                        onClick={() => handleStockAdjustment(params.row._id, 1)}
                        title="Add stock"
                    >
                        <AddCircle />
                    </IconButton>
                    <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleStockAdjustment(params.row._id, -1)}
                        title="Remove stock"
                    >
                        <RemoveCircle />
                    </IconButton>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDelete(params.row._id)}
                >
                    <DeleteIcon />
                </IconButton>
            )
        }
    ];

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Inventory Management
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenModal(true)}
                            color="primary"
                        >
                            Add
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={handleImport}
                            color="success"
                        >
                            Import
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExport}
                            color="warning"
                        >
                            Export
                        </Button>
                    </Box>
                </Box>

                <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6">
                        Total Inventory Value: ₹{totalInventoryValue.toLocaleString()}
                    </Typography>
                </Paper>

                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={inventoryItems}
                        columns={columns}
                        loading={loading}
                        paginationMode="server"
                        rowCount={totalCount}
                        paginationModel={paginationModel}
                        onPaginationModelChange={(model) => {
                            setPaginationModel(model);
                            fetchInventory(model.page, model.pageSize);
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        disableRowSelectionOnClick
                    />
                </Box>
            </Box>

            <InventoryAgentChat />

            <MuiModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                title="Add Inventory Item"
            >
                <AddInventory onItemAdded={handleItemAdded} onCancel={() => setOpenModal(false)} />
            </MuiModal>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, itemId: null })}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this inventory item? This action cannot be undone."
                confirmText="Delete"
                confirmColor="error"
            />

            {/* Stock Adjustment Prompt Dialog */}
            <PromptDialog
                open={promptDialog.open}
                onClose={() => setPromptDialog({ open: false, itemId: null, adjustment: 0 })}
                onConfirm={confirmStockAdjustment}
                title={`${promptDialog.adjustment > 0 ? 'Add' : 'Remove'} Stock`}
                message={`Enter the quantity to ${promptDialog.adjustment > 0 ? 'add to' : 'remove from'} inventory:`}
                label="Quantity"
                type="number"
            />

            {/* Alert Dialog */}
            <AlertDialog
                open={alertDialog.open}
                onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title}
                message={alertDialog.message}
                severity={alertDialog.severity}
            />
        </Layout>
    );
}

export default Inventory;