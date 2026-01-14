import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Box,
    useMediaQuery,
    useTheme,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    Toolbar,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    ShoppingCart as ShoppingCartIcon,
    People as PeopleIcon,
    Receipt as ReceiptIcon,
    LocalOffer as DealsIcon,
    Assignment as TaskIcon,
    Event as EventIcon,
    CalendarMonth as CalendarIcon,
    Note as NoteIcon,
    Assessment as ReportIcon,
    AttachMoney as ExpenseIcon,
    ShoppingBag as OrdersIcon,
    Payment as PaymentIcon,
    Group as StaffIcon,
    ExpandLess,
    ExpandMore,
    Store as StoreIcon,
    LocalShipping as VendorIcon,
    Category as ProductIcon,
    Close as CloseIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';

const drawerWidth = 280;
const miniDrawerWidth = 80;

function Sidebar({ mobileOpen, onDrawerToggle, desktopOpen, onDesktopToggle }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [inventoryOpen, setInventoryOpen] = useState(true);
    const [saleOpen, setSaleOpen] = useState(true);
    const [productivityOpen, setProductivityOpen] = useState(true);
    const [staffOpen, setStaffOpen] = useState(true);

    // State for popup menus when collapsed
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentMenu, setCurrentMenu] = useState(null);

    const isActive = (path) => location.pathname === path;

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            onDrawerToggle();
        }
        handleCloseMenu();
    };

    const handleOpenMenu = (event, menuName) => {
        setAnchorEl(event.currentTarget);
        setCurrentMenu(menuName);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setCurrentMenu(null);
    };

    const menuItems = [
        { title: 'Dashboard', icon: <DashboardIcon />, path: '/Dashboard' },
        {
            title: 'Inventory',
            icon: <InventoryIcon />,
            isDropdown: true,
            open: inventoryOpen,
            setOpen: setInventoryOpen,
            subItems: [
                { title: 'Manage Inventory', path: '/Inventory', icon: <StoreIcon /> },
                { title: 'Vendors', path: '/Vendor', icon: <VendorIcon /> },
                { title: 'Products', path: '/Product', icon: <ProductIcon /> },
            ],
        },
        {
            title: 'Sale',
            icon: <ShoppingCartIcon />,
            isDropdown: true,
            open: saleOpen,
            setOpen: setSaleOpen,
            subItems: [
                { title: 'Sales', path: '/Sales', icon: <ShoppingCartIcon /> },
                { title: 'Customers', path: '/Customer', icon: <PeopleIcon /> },
                { title: 'Invoices', path: '/Invoices', icon: <ReceiptIcon /> },
            ],
        },
        { title: 'Deals', icon: <DealsIcon />, path: '/Deals' },
        {
            title: 'Productivity',
            icon: <TaskIcon />,
            isDropdown: true,
            open: productivityOpen,
            setOpen: setProductivityOpen,
            subItems: [
                { title: 'Task', path: '/Task', icon: <TaskIcon /> },
                { title: 'Appointment', path: '/Appointment', icon: <EventIcon /> },
                { title: 'Calendar', path: '/Calendar', icon: <CalendarIcon /> },
                { title: 'Notes', path: '/Notes', icon: <NoteIcon /> },
            ],
        },
        { title: 'Report', icon: <ReportIcon />, path: '/Report' },
        { title: 'Expense', icon: <ExpenseIcon />, path: '/Expenses' },
        { title: 'Orders', icon: <OrdersIcon />, path: '/Orders' },
        { title: 'Payments', icon: <PaymentIcon />, path: '/Payment' },
        {
            title: 'Staff',
            icon: <StaffIcon />,
            isDropdown: true,
            open: staffOpen,
            setOpen: setStaffOpen,
            subItems: [
                { title: 'Manage Staff', path: '/Staff', icon: <StaffIcon /> },
                { title: 'Staff Task', path: '/StaffTask', icon: <TaskIcon /> },
            ],
        },
    ];

    const drawer = (isCollapsed) => (
        <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Add Toolbar spacer to push content below navbar - only on desktop */}
            {!isMobile && <Toolbar />}

            {/* Desktop open button - show when sidebar is collapsed */}
            {!isMobile && !desktopOpen && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        onClick={onDesktopToggle}
                        sx={{
                            color: '#666',
                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' }
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                </Box>
            )}

            {isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                    <IconButton onClick={onDrawerToggle} sx={{ color: '#666' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            )}

            <List sx={{ px: 1, pt: isMobile ? 0 : 2 }}>
                {menuItems.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.isDropdown && !isCollapsed ? (
                            <>
                                <ListItem disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => item.setOpen(!item.open)}
                                        sx={{
                                            borderRadius: 2,
                                            color: '#1f2937',
                                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: '#1f2937', minWidth: 40 }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.title}
                                            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                                        />
                                        {item.open ? <ExpandLess sx={{ color: '#6b7280' }} /> : <ExpandMore sx={{ color: '#6b7280' }} />}
                                    </ListItemButton>
                                </ListItem>
                                <Collapse in={item.open} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {item.subItems.map((subItem, subIndex) => (
                                            <ListItem key={subIndex} disablePadding sx={{ mb: 0.5 }}>
                                                <ListItemButton
                                                    onClick={() => handleNavigation(subItem.path)}
                                                    selected={isActive(subItem.path)}
                                                    sx={{
                                                        pl: 4,
                                                        borderRadius: 2,
                                                        color: '#1f2937',
                                                        '&.Mui-selected': {
                                                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.16)' },
                                                        },
                                                        '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ color: '#1f2937', minWidth: 40 }}>
                                                        {subItem.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={subItem.title}
                                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                            </>
                        ) : item.isDropdown && isCollapsed ? (
                            // Collapsed dropdown - show popup menu on click
                            <>
                                <ListItem disablePadding sx={{ mb: 0.5 }}>
                                    <Tooltip title={item.title} placement="right">
                                        <ListItemButton
                                            onClick={(e) => handleOpenMenu(e, item.title)}
                                            sx={{
                                                borderRadius: 2,
                                                color: '#1f2937',
                                                justifyContent: 'center',
                                                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: '#1f2937', minWidth: 0 }}>
                                                {item.icon}
                                            </ListItemIcon>
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={currentMenu === item.title}
                                    onClose={handleCloseMenu}
                                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                >
                                    {item.subItems.map((subItem, subIndex) => (
                                        <MenuItem
                                            key={subIndex}
                                            onClick={() => handleNavigation(subItem.path)}
                                            selected={isActive(subItem.path)}
                                        >
                                            <ListItemIcon sx={{ color: '#1f2937' }}>
                                                {subItem.icon}
                                            </ListItemIcon>
                                            <ListItemText primary={subItem.title} />
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
                        ) : (
                            <ListItem disablePadding sx={{ mb: 0.5 }}>
                                <Tooltip title={isCollapsed ? item.title : ''} placement="right">
                                    <ListItemButton
                                        onClick={() => handleNavigation(item.path)}
                                        selected={!item.isDropdown && isActive(item.path)}
                                        sx={{
                                            borderRadius: 2,
                                            color: '#1f2937',
                                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                                            '&.Mui-selected': {
                                                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.16)' },
                                            },
                                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: '#1f2937', minWidth: isCollapsed ? 0 : 40 }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        {!isCollapsed && (
                                            <ListItemText
                                                primary={item.title}
                                                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                                            />
                                        )}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: desktopOpen ? drawerWidth : miniDrawerWidth }, flexShrink: { sm: 0 } }}>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        backgroundColor: '#f5f5f5',
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                    },
                }}
            >
                {drawer(false)}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: desktopOpen ? drawerWidth : miniDrawerWidth,
                        backgroundColor: '#f5f5f5',
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                    },
                }}
                open
            >
                {drawer(!desktopOpen)}
            </Drawer>
        </Box>
    );
}

export default Sidebar;
