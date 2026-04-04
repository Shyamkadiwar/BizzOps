import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Expense } from '../models/expense.model.js';

const addExpense = asyncHandler(async (req, res) => {
    const { name, expAmount, description, date } = req.body;
    const owner = req.user?._id;
    if (!name || !expAmount || !description || !date) {
        throw new ApiError(400, "All fields are required");
    }
    if (!owner) {
        throw new ApiError(400, "Unauthorized request");
    }

    const expense = await Expense.create({
        name,
        expAmount,
        description,
        date,
        owner
    });
    if (!expense) {
        throw new ApiError(400, "Error while creating expense");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { expense }, "Expense added successfully"));
});

const getExpense = asyncHandler(async (req, res) => {
    const { timeFilter } = req.params;
    const ownerId = req.user?._id;

    let filter = { owner: ownerId };

    switch (timeFilter) {
        case 'oneday':
            const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1));
            filter.date = { $gte: oneDayAgo };
            break;
        case 'past30days':
            const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
            filter.date = { $gte: thirtyDaysAgo };
            break;
        case 'alltime':
        default:
            break;
    }

    const expense = await Expense.find(filter);
    return res
        .status(200)
        .json(new ApiResponse(200, { expense }, "Expenses retrieved successfully"));
});

const getOneDayExpense = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await Expense.aggregate([
        { $match: { owner: ownerId, date: { $gte: startOfToday } } },
        {
            $group: {
                _id: null,
                totalExpenseValue: { $sum: "$expAmount" },
            },
        },
    ]);

    const totalExpenseValue = result.length > 0 ? result[0].totalExpenseValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalExpenseValue }, "Total expense value for one day retrieved successfully"));
});

const getLast30DaysExpense = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    const result = await Expense.aggregate([
        { $match: { owner: ownerId, date: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: null,
                totalExpenseValue: { $sum: "$expAmount" }
            }
        }
    ]);

    const totalExpenseValue = result.length > 0 ? result[0].totalExpenseValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalExpenseValue }, "Total expense value for past 30 days retrieved successfully"));
});

const getAllTimeExpense = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    const result = await Expense.aggregate([
        { $match: { owner: ownerId } },
        {
            $group: {
                _id: null,
                totalExpenseValue: { $sum: "$expAmount" }
            }
        }
    ]);

    const totalExpenseValue = result.length > 0 ? result[0].totalExpenseValue : 0;

    return res
        .status(200)
        .json(new ApiResponse(200, { totalExpenseValue }, "Total expense value for all time retrieved successfully"));
});

const getDailyTotalExpenseValuePast30Days = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    
    const result = await Expense.aggregate([
        { $match: { owner: ownerId, date: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                },
                totalExpenseValue: { $sum: "$expAmount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    const dailyExpenses = result.map(item => ({
        date: item._id,
        totalExpenseValue: item.totalExpenseValue
    }));
    
    return res
        .status(200)
        .json(new ApiResponse(200, { dailyExpenses }, "Daily total expense value for past 30 days retrieved successfully"));
});

const deleteExpense = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const ownerId = req.user?._id;

    if (!id) {
        throw new ApiError(400, "Expense ID is required");
    }

    const expense = await Expense.findOneAndDelete({ _id: id, owner: ownerId });

    if (!expense) {
        throw new ApiError(404, "Expense not found or unauthorized");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Expense deleted successfully"));
});





export {
    addExpense,
    getExpense,
    getAllTimeExpense,
    getLast30DaysExpense,
    getOneDayExpense,
    getDailyTotalExpenseValuePast30Days,
    deleteExpense
};
