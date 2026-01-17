import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Deal } from "../models/deal.model.js";

// Create new deal
const createDeal = asyncHandler(async (req, res) => {
    const { title, description, status, customer, value, probability, expectedCloseDate, involvedPersons, notes } = req.body;
    const owner = req.user?._id;

    if (!title) {
        throw new ApiError(400, "Title is required");
    }
    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deal = await Deal.create({
        title,
        description,
        status: status || 'New',
        customer,
        value: value || 0,
        probability: probability || 50,
        expectedCloseDate,
        involvedPersons,
        notes,
        owner,
        activities: [{
            type: 'Created',
            description: `Deal created with status: ${status || 'New'}`,
            timestamp: new Date()
        }]
    });

    const populatedDeal = await Deal.findById(deal._id).populate('customer', 'name email phone');

    return res
        .status(201)
        .json(new ApiResponse(201, populatedDeal, "Deal created successfully"));
});

// Get all deals for user
const getDeals = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const { status } = req.query;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const filter = { owner: ownerId };
    if (status) {
        filter.status = status;
    }

    const deals = await Deal.find(filter)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 });

    // Group deals by status for pipeline view
    const groupedDeals = {
        New: [],
        Prospect: [],
        Proposal: [],
        Won: [],
        Lost: []
    };

    let totalValue = 0;
    deals.forEach(deal => {
        if (groupedDeals[deal.status]) {
            groupedDeals[deal.status].push(deal);
        }
        if (deal.status === 'Won') {
            totalValue += deal.value || 0;
        }
    });

    // Calculate total value for each status
    const statusTotals = {
        New: groupedDeals.New.reduce((sum, deal) => sum + (deal.value || 0), 0),
        Prospect: groupedDeals.Prospect.reduce((sum, deal) => sum + (deal.value || 0), 0),
        Proposal: groupedDeals.Proposal.reduce((sum, deal) => sum + (deal.value || 0), 0),
        Won: groupedDeals.Won.reduce((sum, deal) => sum + (deal.value || 0), 0),
        Lost: groupedDeals.Lost.reduce((sum, deal) => sum + (deal.value || 0), 0)
    };

    return res
        .status(200)
        .json(new ApiResponse(200, { deals, groupedDeals, statusTotals }, "Deals retrieved successfully"));
});

// Get deal by ID
const getDealById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deal = await Deal.findOne({ _id: id, owner: ownerId })
        .populate('customer', 'name email phone address');

    if (!deal) {
        throw new ApiError(404, "Deal not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deal, "Deal retrieved successfully"));
});

// Update deal
const updateDeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;
    const updateData = req.body;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deal = await Deal.findOne({ _id: id, owner: ownerId });

    if (!deal) {
        throw new ApiError(404, "Deal not found");
    }

    // Track status changes
    if (updateData.status && updateData.status !== deal.status) {
        deal.activities.push({
            type: 'Status Changed',
            description: `Status changed from ${deal.status} to ${updateData.status}`,
            timestamp: new Date()
        });

        // Set actual close date if status is Won or Lost
        if (updateData.status === 'Won' || updateData.status === 'Lost') {
            updateData.actualCloseDate = new Date();
        }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
        if (key !== 'activities' && key !== 'owner') {
            deal[key] = updateData[key];
        }
    });

    await deal.save();

    const updatedDeal = await Deal.findById(deal._id).populate('customer', 'name email phone');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedDeal, "Deal updated successfully"));
});

// Update deal status (for drag-and-drop)
const updateDealStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!status || !['New', 'Prospect', 'Proposal', 'Won', 'Lost'].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const deal = await Deal.findOne({ _id: id, owner: ownerId });

    if (!deal) {
        throw new ApiError(404, "Deal not found");
    }

    const oldStatus = deal.status;
    deal.status = status;

    // Add activity
    deal.activities.push({
        type: 'Status Changed',
        description: `Status changed from ${oldStatus} to ${status}`,
        timestamp: new Date()
    });

    // Set actual close date if status is Won or Lost
    if (status === 'Won' || status === 'Lost') {
        deal.actualCloseDate = new Date();
    }

    await deal.save();

    return res
        .status(200)
        .json(new ApiResponse(200, deal, "Deal status updated successfully"));
});

// Delete deal
const deleteDeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deletedDeal = await Deal.findOneAndDelete({ _id: id, owner: ownerId });

    if (!deletedDeal) {
        throw new ApiError(404, "Deal not found or unauthorized");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Deal deleted successfully"));
});

// Get deal statistics
const getDealStats = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deals = await Deal.find({ owner: ownerId });

    const stats = {
        total: deals.length,
        byStatus: {
            New: 0,
            Prospect: 0,
            Proposal: 0,
            Won: 0,
            Lost: 0
        },
        totalValue: 0,
        wonValue: 0,
        averageDealValue: 0
    };

    deals.forEach(deal => {
        stats.byStatus[deal.status]++;
        stats.totalValue += deal.value || 0;
        if (deal.status === 'Won') {
            stats.wonValue += deal.value || 0;
        }
    });

    stats.averageDealValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Deal statistics retrieved successfully"));
});

export {
    createDeal,
    getDeals,
    getDealById,
    updateDeal,
    updateDealStatus,
    deleteDeal,
    getDealStats
};
