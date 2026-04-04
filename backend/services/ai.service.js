import { GoogleGenAI } from '@google/genai';
import { Inventory } from '../models/inventory.model.js';
import { Sales } from '../models/sales.model.js';
import { Expense } from '../models/expense.model.js';
import { Invoice } from '../models/invoice.model.js';
import { Staff } from '../models/staff.model.js';
import { Order } from '../models/orders.model.js';
import { Customer } from '../models/customer.models.js';
import { Vendor } from '../models/vendor.model.js';
import { Appointment } from '../models/appointment.model.js';
import { Task } from '../models/task.model.js';
import { Deal } from '../models/deal.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

const defaultAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getAI = (apiKey) => apiKey ? new GoogleGenAI({ apiKey }) : defaultAI;

const modelsMap = {
  Sales,
  Inventory,
  Expense,
  Invoice,
  Staff,
  Order,
  Customer,
  Vendor,
  Appointment,
  Task,
  Deal,
  Product,
};

// ─── Schema Reference for system prompt ──────────────────────────────────────
const SCHEMA_REFERENCE = `
AVAILABLE COLLECTIONS AND THEIR EXACT FIELDS:

Sales: owner, items[{product, productName, qty, price, cost, taxes[{name,rate}], itemTotal, itemProfit}], customer, customerName, totalSale, totalCost, totalProfit, profitPercent, invoice, paid(boolean), date, createdAt
  → Use sortBy:"totalSale" for highest sale. Date field: "date". Key numbers: totalSale, totalProfit, profitPercent.

Expense: owner, name, expAmount, description, date, createdAt
  → Key number: expAmount. Date field: "date". Use aggregateField:"expAmount" for totals.

Inventory: owner, product, item(string), category, warehouse, cost, salePrice, vendor, paid(boolean), purchaseAmount, taxes, stockRemain, date, createdAt
  → Low stock = low stockRemain. Key numbers: stockRemain, cost, salePrice, purchaseAmount.

Invoice: owner, invoiceNumber, sale, customer, customerName, customerEmail, customerPhone, customerAddress, name, items[{itemName, qty, price, cost, taxes, total}], paid(boolean), paidDate, subTotal, grandTotal, date, razorpayPaymentLinkId, createdAt
  → Key numbers: grandTotal, subTotal. Date field: "date". Use paid:true/false to filter paid/unpaid.

Staff: owner, name, salary, debitCreditHistory, phone, email
  → Key numbers: salary, debitCreditHistory. No date field — use createdAt for sorting.

Order: owner, item(string), qty, price, dateToDilivery, profit, cost, profitInPercent, sale, done(boolean), createdAt
  → Pending orders = done:false. Date field: "dateToDilivery". Key numbers: sale, profit, cost.

Customer: owner, name, email, phone, city, address, gstNumber, company, state, pincode, notes, balance, totalSales, totalProfit, createdAt
  → Key numbers: balance, totalSales, totalProfit. Sort by totalSales for best customers.

Vendor: owner, name, email, phone, address, city, state, gstNumber, balance, totalPurchases, totalPaid, createdAt
  → Key numbers: balance, totalPurchases, totalPaid.

Appointment: owner, title, description, startTime, endTime, location, attendees, customer, type(Meeting/Call/Site Visit/Other), reminder, createdAt
  → Date field: "startTime". Future appointments = startTime > today.

Task: owner, name, description, priority(Low/Medium/High/Urgent), status(Not Started/In Progress/Waiting/Done), dueDate, assignedTo, subtasks, tags, createdAt
  → Date field: "dueDate". Overdue = dueDate before today and status != Done. Filter by status for pending work.

Deal: owner, title, description, status(New/Prospect/Proposal/Won/Lost), customer, value, probability, expectedCloseDate, actualCloseDate, involvedPersons, notes, activities, createdAt
  → Key number: value. Won deals = status:"Won". Sort by value for biggest deals.

Product: owner, name, category, cost, salePrice, vendor, taxes, description, createdAt
  → Key numbers: cost, salePrice.
`;

// ─── Tools ───────────────────────────────────────────────────────────────────
const tools = [
  {
    name: 'queryBusinessData',
    description:
      'Fetch actual records from the database. Use for: finding specific records (highest sale, overdue tasks, pending orders, upcoming appointments), getting lists, or spotting individual items. Returns up to 50 raw records. Always refer to the schema to pick the correct fieldName.',
    parameters: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          enum: ['Sales', 'Inventory', 'Expense', 'Invoice', 'Staff', 'Order', 'Customer', 'Vendor', 'Appointment', 'Task', 'Deal', 'Product'],
        },
        startDate: { type: 'string', description: 'ISO date string — filter records on or after this date' },
        endDate: { type: 'string', description: 'ISO date string — filter records on or before this date' },
        dateField: { type: 'string', description: 'Field name for date filtering. Refer to schema. E.g. "date", "startTime", "dueDate", "dateToDilivery", "createdAt"' },
        sortBy: { type: 'string', description: 'Field to sort by. Refer to schema for valid field names.' },
        sortOrder: { type: 'number', description: '1 for ascending (lowest first), -1 for descending (highest first)' },
        limit: { type: 'number', description: 'Max records to return. Default 10, max 50.' },
        matchCriteria: { type: 'string', description: 'JSON string for extra MongoDB filters. E.g. "{\"paid\": false}" or "{\"status\": \"Done\"}"' },
      },
      required: ['collection'],
    },
  },
  {
    name: 'aggregateBusinessData',
    description:
      'Calculate totals, averages, max/min, or count across thousands of records. Use for: total revenue, average expense, count of pending tasks, max sale value, etc. Much more efficient than fetching all records.',
    parameters: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          enum: ['Sales', 'Inventory', 'Expense', 'Invoice', 'Staff', 'Order', 'Customer', 'Vendor', 'Appointment', 'Task', 'Deal', 'Product'],
        },
        operation: { type: 'string', enum: ['sum', 'avg', 'max', 'min', 'count'] },
        aggregateField: { type: 'string', description: 'Numeric field to aggregate (e.g. "totalSale", "expAmount", "grandTotal", "value"). Not needed for "count".' },
        startDate: { type: 'string', description: 'ISO date string — filter records on or after this date' },
        endDate: { type: 'string', description: 'ISO date string — filter records on or before this date' },
        dateField: { type: 'string', description: 'Field name for date filtering. Refer to schema.' },
        matchCriteria: { type: 'string', description: 'JSON string for extra MongoDB filters.' },
      },
      required: ['collection', 'operation'],
    },
  },
];

// ─── Function Handlers ────────────────────────────────────────────────────────
const functionHandlers = {
  queryBusinessData: async (args, ownerId) => {
    const { collection, startDate, endDate, dateField = 'date', sortBy, sortOrder, limit = 10, matchCriteria } = args;

    if (!modelsMap[collection]) return { error: `Collection "${collection}" not found.` };

    const Model = modelsMap[collection];
    let query = { owner: new mongoose.Types.ObjectId(ownerId) };

    if (startDate || endDate) {
      query[dateField] = {};
      if (startDate) query[dateField].$gte = new Date(startDate);
      if (endDate) query[dateField].$lte = new Date(endDate);
    }

    if (matchCriteria) {
      try {
        const parsed = JSON.parse(matchCriteria);
        query = { ...query, ...parsed };
      } catch (e) {
        console.error('[AI] Failed to parse matchCriteria:', matchCriteria);
      }
    }

    let dbQuery = Model.find(query);

    const sortField = sortBy || dateField;
    const sortDir = sortOrder ? parseInt(sortOrder) : -1;
    dbQuery = dbQuery.sort({ [sortField]: sortDir });

    const actualLimit = Math.min(parseInt(limit) || 10, 50);
    const results = await dbQuery.limit(actualLimit).lean().exec();

    return {
      count: results.length,
      collection,
      data: results,
    };
  },

  aggregateBusinessData: async (args, ownerId) => {
    const { collection, operation, aggregateField, startDate, endDate, dateField = 'date', matchCriteria } = args;

    if (!modelsMap[collection]) return { error: `Collection "${collection}" not found.` };

    const Model = modelsMap[collection];
    let matchQuery = { owner: new mongoose.Types.ObjectId(ownerId) };

    if (startDate || endDate) {
      matchQuery[dateField] = {};
      if (startDate) matchQuery[dateField].$gte = new Date(startDate);
      if (endDate) matchQuery[dateField].$lte = new Date(endDate);
    }

    if (matchCriteria) {
      try {
        const parsed = JSON.parse(matchCriteria);
        matchQuery = { ...matchQuery, ...parsed };
      } catch (e) {
        console.error('[AI] Failed to parse matchCriteria:', matchCriteria);
      }
    }

    let groupStage = { _id: null };

    if (operation === 'count') {
      groupStage.result = { $sum: 1 };
    } else {
      if (!aggregateField) return { error: `aggregateField is required for operation "${operation}".` };
      if (operation === 'sum') groupStage.result = { $sum: `$${aggregateField}` };
      if (operation === 'avg') groupStage.result = { $avg: `$${aggregateField}` };
      if (operation === 'max') groupStage.result = { $max: `$${aggregateField}` };
      if (operation === 'min') groupStage.result = { $min: `$${aggregateField}` };
    }

    const stats = await Model.aggregate([{ $match: matchQuery }, { $group: groupStage }]);

    if (!stats.length) return { message: `No data found in ${collection}.`, result: 0 };

    return {
      operation,
      collection,
      aggregateField: aggregateField || 'records',
      result: stats[0].result,
    };
  },
};

// ─── System Prompt Builder ───────────────────────────────────────────────────
const buildSystemPrompt = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const dateStr = ist.toISOString().replace('T', ' ').slice(0, 19) + ' IST';

  return `You are Biz, the friendly AI assistant built into BizzOps — a business management platform.
Today's date and time: ${dateStr}

YOUR PERSONALITY:
You are warm, smart, and concise — like a knowledgeable colleague who gets straight to the point.
Never be robotic or overly formal.

CRITICAL RESPONSE RULES — follow these strictly without exception:
1. Never use # (headings), * (bullet/bold), or - (dash lists) in your response. These will break the UI.
2. Use plain sentences only. For lists, write them inline or separate with line breaks.
3. Keep answers short — 1 to 4 sentences is ideal. Never write a wall of text.
4. If showing a list of items, format each on its own line with no dashes or numbers — just the item name and value.
5. Always round currency to 2 decimal places. Use ₹ for Indian Rupee amounts.
6. If you don't have enough data from your tools, say so honestly in one sentence.
7. Never make up data. Only use what your tools return.

HOW TO USE YOUR TOOLS:
Use queryBusinessData when the user asks for specific records, names, or a list of items.
Use aggregateBusinessData when the user asks for totals, averages, counts, or overall summaries.
You can call multiple tools in sequence to answer compound questions.

${SCHEMA_REFERENCE}

EXAMPLES OF GOOD RESPONSES:
User: "What was my highest sale?"
Good: "Your highest sale was ₹12,500 on 15 March 2025, for customer Rahul Sharma — 3 items including Widget Pro and Gizmo X."

User: "How many tasks are pending?"
Good: "You have 7 pending tasks right now. 2 are overdue — Quick Report (due 1 Apr) and Client Follow-up (due 2 Apr)."

User: "Total expenses this month?"
Good: "Your total expenses for April 2026 are ₹34,200 across 12 entries."`;
};

// ─── Main Chat Function ───────────────────────────────────────────────────────
export const processChatQuery = async (query, ownerId, conversationHistory = [], userApiKey = null) => {
  const ai = getAI(userApiKey);
  try {
    // Build chat history in Gemini format
    // conversationHistory is [{role:'user'|'assistant', text:'...'}]
    const history = conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const chatSession = await ai.chats.create({
      model: 'gemini-3.1-flash-lite-preview',
      config: {
        systemInstruction: buildSystemPrompt(),
        tools: [{ functionDeclarations: tools }],
        temperature: 0.25,
      },
      history,
    });

    let response = await chatSession.sendMessage({ message: query });

    // Function calling loop — handle multiple tool calls
    const callHistory = [];
    let loopCount = 0;

    while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 5) {
      loopCount++;
      const call = response.functionCalls[0];
      const { name: functionName, args } = call;

      console.log(`[AI Agent] Tool call #${loopCount}: ${functionName}`, JSON.stringify(args));

      let functionResult = {};
      if (functionHandlers[functionName]) {
        functionResult = await functionHandlers[functionName](args, ownerId);
      } else {
        functionResult = { error: `Tool "${functionName}" is not available.` };
      }

      callHistory.push({ tool: functionName, args, result: functionResult });

      response = await chatSession.sendMessage({
        message: [
          {
            functionResponse: {
              name: functionName,
              response: functionResult,
            },
          },
        ],
      });
    }

    return {
      answer: response.text,
      toolsUsed: callHistory.map((c) => c.tool),
    };
  } catch (error) {
    console.error('[AI] processChatQuery error:', error);
    throw new Error('Failed to process your query. Please try again.');
  }
};

// ─── KPI Insight Generator ───────────────────────────────────────────────────
export const generateKpiInsight = async (metricName, historicalData, userApiKey = null) => {
  const ai = getAI(userApiKey);
  try {
    const { currentVal, sparklineData = [] } = historicalData;

    // Calculate trend direction from sparkline
    let trendDescription = 'stable';
    if (sparklineData.length >= 2) {
      const first = sparklineData[0];
      const last = sparklineData[sparklineData.length - 1];
      const change = last - first;
      const pct = first !== 0 ? ((change / first) * 100).toFixed(1) : 0;
      if (change > 0) trendDescription = `up ${pct}% over the tracked period`;
      else if (change < 0) trendDescription = `down ${Math.abs(pct)}% over the tracked period`;
    }

    const prompt = `You are a friendly business advisor inside BizzOps, a business management app.

Analyze this KPI and write a short insight for the business owner.

Metric: ${metricName}
Current Value: ${currentVal}
Trend: ${trendDescription}
Historical Data Points: ${JSON.stringify(sparklineData)}

RULES — follow strictly:
1. Write exactly 2 sentences. No more, no less.
2. Never use #, *, or - characters.
3. Be warm and conversational. Not robotic.
4. First sentence: describe what the trend looks like.
5. Second sentence: give one practical tip or encouraging note based on the trend.
6. Use ₹ for currency values if relevant.
7. Keep it simple — a business owner without financial expertise should understand it.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.4 },
    });

    // Strip any rogue markdown symbols that might sneak through
    const raw = response.text || '';
    const clean = raw.replace(/[#*\-]/g, '').replace(/\n{3,}/g, '\n\n').trim();

    return clean;
  } catch (error) {
    console.error('[AI] generateKpiInsight error:', error);
    throw new Error('Failed to generate KPI insight.');
  }
};

// ─── Dashboard Insights Generator ────────────────────────────────────────────
export const generateDashboardInsights = async (businessData, userApiKey = null) => {
  const ai = getAI(userApiKey);
  try {
    const prompt = `You are a friendly business advisor inside BizzOps. Analyze this live business data snapshot and generate exactly 3 actionable insights.

Business Data:
${JSON.stringify(businessData, null, 2)}

OUTPUT FORMAT - return a valid JSON array, nothing else. Each object must have:
- type: "success" or "warning" or "error" or "info"
- priority: "high" or "medium" or "low"
- title: short title (4-6 words, no punctuation)
- description: one plain sentence insight (no # * or - characters, under 120 characters)

Rules:
1. Base insights ONLY on the provided data
2. If a metric is 0, note it as an opportunity
3. Prioritize high for urgent issues, medium for growth, low for positives
4. Keep descriptions friendly and actionable
5. Return ONLY the JSON array with no explanation or markdown

Example: [{"type":"success","priority":"low","title":"Strong Sales Momentum","description":"Your sales show healthy growth this period keep up the momentum."}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    });

    const raw = response.text || '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    const insights = JSON.parse(jsonMatch[0]);

    return insights.slice(0, 4).map((ins) => ({
      type: ['success', 'warning', 'error', 'info'].includes(ins.type) ? ins.type : 'info',
      priority: ['high', 'medium', 'low'].includes(ins.priority) ? ins.priority : 'medium',
      title: String(ins.title || '').replace(/[#*]/g, '').trim(),
      description: String(ins.description || '').replace(/[#*]/g, '').trim(),
    }));
  } catch (error) {
    console.error('[AI] generateDashboardInsights error:', error);
    throw new Error('Failed to generate dashboard insights.');
  }
};
