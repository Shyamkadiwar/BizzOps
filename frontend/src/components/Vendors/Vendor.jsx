import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, IconButton, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';
import ProfessionalDataGrid from "../shared/ProfessionalDataGrid.jsx";
import MuiModal from "../shared/MuiModal.jsx";
import Layout from "../Layout.jsx";
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import VendorDetailsModal from './VendorDetailsModal.jsx';
import AddVendor from './AddVendor.jsx';

const token = localStorage.getItem('accessToken');

const Vendor = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorDetailsOpen, setVendorDetailsOpen] = useState(false);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/list?limit=1000`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            const vendorData = response.data.data.vendors.map(vendor => ({
                ...vendor,
                id: vendor._id
            }));
            setVendors(vendorData);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleVendorAdded = () => {
        setOpenModal(false);
        fetchVendors();
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            open: true,
            title: "Delete Vendor",
            message: "Are you sure you want to delete this vendor?",
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vendor/delete/${id}`,
                        { headers: { 'Authorization': token }, withCredentials: true }
                    );
                    fetchVendors();
                } catch (error) {
                    console.error('Error deleting vendor:', error);
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            width: 180,
            filterable: true,
            renderCell: (params) => (
                <Typography
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => {
                        setSelectedVendor(params.row._id);
                        setVendorDetailsOpen(true);
                    }}
                >
                    {params.value}
                </Typography>
            )
        },
        { field: 'email', headerName: 'Email', width: 200, filterable: true },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'city', headerName: 'City', width: 120, filterable: true },
        {
            field: 'balance',
            headerName: 'Balance (Owed)',
            width: 150,
            type: 'number',
            renderCell: (params) => (
                <Chip
                    label={`₹${(params.value || 0).toLocaleString('en-IN')}`}
                    color={params.value > 0 ? 'warning' : 'success'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            field: 'totalPurchases',
            headerName: 'Total Purchases',
            width: 150,
            type: 'number',
            valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}`
        },
        {
            field: 'totalPaid',
            headerName: 'Total Paid',
            width: 130,
            type: 'number',
            valueFormatter: (value) => `₹${(value || 0).toLocaleString('en-IN')}`
        },
        { field: 'gstNumber', headerName: 'GST Number', width: 150 },
        { field: 'state', headerName: 'State', width: 120, filterable: true },
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Vendor Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenModal(true)}
                    >
                        Add Vendor
                    </Button>
                </Box>

                <Box sx={{ height: 600, width: '100%' }}>
                    <ProfessionalDataGrid
                        rows={vendors}
                        columns={columns}
                        loading={loading}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        disableRowSelectionOnClick
                    />
                </Box>
            </Box>

            <MuiModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                title="Add Vendor"
            >
                <AddVendor onSuccess={handleVendorAdded} onCancel={() => setOpenModal(false)} />
            </MuiModal>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />

            <VendorDetailsModal
                open={vendorDetailsOpen}
                onClose={() => {
                    setVendorDetailsOpen(false);
                    setSelectedVendor(null);
                    fetchVendors();
                }}
                vendorId={selectedVendor}
            />
        </Layout>
    );
}

export default Vendor;
