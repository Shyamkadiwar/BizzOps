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



import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const prepareExpenseContext = (expenseData) => {
  // Calculate time-based summaries
  const now = new Date();
  const oneDay = new Date(now.setHours(0, 0, 0, 0));
  const oneWeek = new Date(now.setDate(now.getDate() - 7));
  const oneMonth = new Date(now.setDate(now.getDate() - 30));
  const oneYear = new Date(now.setFullYear(now.getFullYear() - 1));

  // Group expenses by category/name
  const categorySummary = expenseData.reduce((acc, expense) => {
    const category = expense.name;
    
    if (!acc[category]) {
      acc[category] = {
        categoryName: category,
        totalAmount: 0,
        count: 0,
        avgAmount: 0,
        transactions: [],
        dateRange: { earliest: new Date(expense.date), latest: new Date(expense.date) }
      };
    }
    
    acc[category].totalAmount += expense.expAmount;
    acc[category].count += 1;
    acc[category].transactions.push({
      amount: expense.expAmount,
      description: expense.description,
      date: expense.date
    });
    
    if (new Date(expense.date) < acc[category].dateRange.earliest) {
      acc[category].dateRange.earliest = new Date(expense.date);
    }
    if (new Date(expense.date) > acc[category].dateRange.latest) {
      acc[category].dateRange.latest = new Date(expense.date);
    }
    
    return acc;
  }, {});

  // Calculate averages for categories
  Object.keys(categorySummary).forEach(category => {
    const cat = categorySummary[category];
    cat.avgAmount = cat.totalAmount / cat.count;
  });

  // Time-based analysis
  const todayExpenses = expenseData.filter(exp => new Date(exp.date) >= oneDay);
  const weekExpenses = expenseData.filter(exp => new Date(exp.date) >= oneWeek);
  const monthExpenses = expenseData.filter(exp => new Date(exp.date) >= oneMonth);
  const yearExpenses = expenseData.filter(exp => new Date(exp.date) >= oneYear);

  // Monthly breakdown
  const monthlyBreakdown = expenseData.reduce((acc, expense) => {
    const month = new Date(expense.date).getMonth();
    const year = new Date(expense.date).getFullYear();
    const monthYear = `${year}-${month + 1}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = { total: 0, count: 0, expenses: [] };
    }
    
    acc[monthYear].total += expense.expAmount;
    acc[monthYear].count += 1;
    acc[monthYear].expenses.push(expense);
    
    return acc;
  }, {});

  // Overall summary
  const overallSummary = {
    totalAmount: expenseData.reduce((sum, exp) => sum + exp.expAmount, 0),
    totalTransactions: expenseData.length,
    avgExpenseAmount: expenseData.reduce((sum, exp) => sum + exp.expAmount, 0) / expenseData.length,
    highestExpense: Math.max(...expenseData.map(exp => exp.expAmount)),
    lowestExpense: Math.min(...expenseData.map(exp => exp.expAmount)),
    dateRange: {
      earliest: new Date(Math.min(...expenseData.map(exp => new Date(exp.date)))),
      latest: new Date(Math.max(...expenseData.map(exp => new Date(exp.date))))
    },
    timePeriods: {
      today: {
        total: todayExpenses.reduce((sum, exp) => sum + exp.expAmount, 0),
        count: todayExpenses.length
      },
      thisWeek: {
        total: weekExpenses.reduce((sum, exp) => sum + exp.expAmount, 0),
        count: weekExpenses.length
      },
      thisMonth: {
        total: monthExpenses.reduce((sum, exp) => sum + exp.expAmount, 0),
        count: monthExpenses.length
      },
      thisYear: {
        total: yearExpenses.reduce((sum, exp) => sum + exp.expAmount, 0),
        count: yearExpenses.length
      }
    }
  };

  return {
    categorySummary,
    overallSummary,
    monthlyBreakdown,
    rawData: expenseData
  };
};

// RAG Query handler for expenses
export const queryExpenseData = asyncHandler(async (req, res) => {
  const { query, timeFilter = 'alltime' } = req.body;
  
  if (!query) {
    throw new ApiError(400, "Query is required");
  }

  // Fetch expense data based on time filter
  let filter = { owner: req.user._id };
  
  switch (timeFilter) {
    case 'today':
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      filter.date = { $gte: startOfToday };
      break;
    case 'week':
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filter.date = { $gte: oneWeekAgo };
      break;
    case 'month':
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      filter.date = { $gte: oneMonthAgo };
      break;
    case 'quarter':
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
      filter.date = { $gte: threeMonthsAgo };
      break;
    case 'year':
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filter.date = { $gte: oneYearAgo };
      break;
    case 'alltime':
    default:
      break;
  }

  const expenseData = await Expense.find(filter).sort({ date: -1 });

  if (!expenseData || expenseData.length === 0) {
    throw new ApiError(404, "No expense data found");
  }

  // Prepare structured context
  const expenseContext = prepareExpenseContext(expenseData);
  
  // Create context string for the AI
  const contextString = `
EXPENSE DATA SUMMARY:
====================

OVERALL METRICS:
- Total Expenses: $${expenseContext.overallSummary.totalAmount.toLocaleString()}
- Total Transactions: ${expenseContext.overallSummary.totalTransactions}
- Average Expense: $${expenseContext.overallSummary.avgExpenseAmount.toFixed(2)}
- Highest Single Expense: $${expenseContext.overallSummary.highestExpense.toLocaleString()}
- Lowest Single Expense: $${expenseContext.overallSummary.lowestExpense.toLocaleString()}
- Date Range: ${expenseContext.overallSummary.dateRange.earliest.toDateString()} to ${expenseContext.overallSummary.dateRange.latest.toDateString()}

TIME PERIOD BREAKDOWN:
- Today: $${expenseContext.overallSummary.timePeriods.today.total.toLocaleString()} (${expenseContext.overallSummary.timePeriods.today.count} transactions)
- This Week: $${expenseContext.overallSummary.timePeriods.thisWeek.total.toLocaleString()} (${expenseContext.overallSummary.timePeriods.thisWeek.count} transactions)
- This Month: $${expenseContext.overallSummary.timePeriods.thisMonth.total.toLocaleString()} (${expenseContext.overallSummary.timePeriods.thisMonth.count} transactions)
- This Year: $${expenseContext.overallSummary.timePeriods.thisYear.total.toLocaleString()} (${expenseContext.overallSummary.timePeriods.thisYear.count} transactions)

EXPENSE CATEGORIES:
${Object.entries(expenseContext.categorySummary).map(([category, data]) => `
- ${data.categoryName}:
  * Total Amount: $${data.totalAmount.toLocaleString()}
  * Number of Transactions: ${data.count}
  * Average Amount: $${data.avgAmount.toFixed(2)}
  * Date Range: ${data.dateRange.earliest.toDateString()} to ${data.dateRange.latest.toDateString()}
`).join('')}

MONTHLY BREAKDOWN:
${Object.entries(expenseContext.monthlyBreakdown).map(([month, data]) => `
- ${month}: $${data.total.toLocaleString()} (${data.count} transactions)
`).join('')}

RECENT TRANSACTIONS (Last 10):
${expenseData.slice(0, 10).map(expense => `
- Date: ${new Date(expense.date).toDateString()}
  Category: ${expense.name}
  Amount: $${expense.expAmount.toLocaleString()}
  Description: ${expense.description || 'No description'}
`).join('')}
  `;

  try {
    // Query Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expense tracking and financial analysis assistant. Use the provided expense data to answer questions accurately. 
          Provide specific numbers, insights, and actionable financial recommendations when possible. 
          Format your response clearly with bullet points or sections when appropriate.
          If asked about spending patterns, calculate percentages and provide comparative analysis.
          Always base your answers strictly on the provided data.
          Focus on helping users understand their spending habits and make better financial decisions.`
        },
        {
          role: "user",
          content: `Based on this expense data:\n\n${contextString}\n\nQuestion: ${query}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    return res
      .status(200)
      .json(new ApiResponse(200, {
        query,
        response: aiResponse,
        dataContext: {
          totalTransactions: expenseContext.overallSummary.totalTransactions,
          totalAmount: expenseContext.overallSummary.totalAmount,
          avgExpenseAmount: expenseContext.overallSummary.avgExpenseAmount,
          dateRange: expenseContext.overallSummary.dateRange,
          timeFilter
        }
      }, "Expense query processed successfully"));

  } catch (error) {
    console.error('RAG Query Error:', error);
    throw new ApiError(500, "Error processing query: " + error.message);
  }
});


export {
    addExpense,
    getExpense,
    getAllTimeExpense,
    getLast30DaysExpense,
    getOneDayExpense,
    getDailyTotalExpenseValuePast30Days
};
