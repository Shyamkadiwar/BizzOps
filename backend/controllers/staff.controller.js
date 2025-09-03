import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import { Staff } from '../models/staff.model.js'

const addStaff = asyncHandler(async(req,res)=>{
    const {name, salary, debitCreditHistory, phone, email} = req.body
    const owner = req.user?._id
    if(!name || !salary || !debitCreditHistory || !phone || !email){
        throw new ApiError(400,"All fields are required")
    }
    if(!owner){
        throw new ApiError(400,"Unauthorized request")
    }
    const staff = await Staff.create({
        owner,
        name,
        salary,
        debitCreditHistory,
        phone,
        email
    })
    if(!staff){
        throw new ApiError(400,"somthing went wrong while creating staff")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{staff},"Staff created successfully"))
})

const getStaff = asyncHandler(async(req,res)=>{
    const owner = req.user?._id
    if(!owner){
        throw new ApiError(400,"Unauthorized request")
    }

    const staff = await Staff.find({owner})
    if(!staff){
        throw new ApiError(400,"somthing went wrong while fetching staff")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{staff},"Staff retrived successfully"))
})

const staffCredit = asyncHandler(async(req,res)=>{
    let {staff, amount} = req.body
    const owner = req.user?._id
    if(!staff || !amount){
        throw new ApiError(400,"All fields are required")
    }
    if(!owner){
        throw new ApiResponse(400,"Unauthorized request")
    }

    const credit = await Staff.findOne({_id:staff, owner})
    if(!credit){
        throw new ApiResponse(400,"Staff not found")
    }

    credit.debitCreditHistory += amount
    await credit.save()

    return res
    .status(200)
    .json(new ApiResponse(200,{credit},"Amount added successfully"))
})

const staffDebit = asyncHandler(async(req,res)=>{
    let {staff, amount} = req.body
    const owner = req.user?._id
    if(!staff || !amount){
        throw new ApiError(400,"All fields are required")
    }
    if(!owner){
        throw new ApiResponse(400,"Unauthorized request")
    }

    const debit = await Staff.findOne({_id:staff, owner})
    if(!debit){
        throw new ApiResponse(400,"Staff not found")
    }

    debit.debitCreditHistory -= amount
    await debit.save()

    return res
    .status(200)
    .json(new ApiResponse(200,{debit},"Amount added successfully"))
})

const deleteStaff = asyncHandler(async (req, res) => {
    const { staff } = req.body;  // staff is the id of the staff item
    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(400, "User not found");
    }

    if (!staff) {
        throw new ApiError(400, "Staff ID is required");
    }

    const staffItem = await Staff.deleteOne({ _id: staff, owner });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Staff item deleted successfully"));
});



import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Make sure to add this to your .env file
});

// Helper function to process and structure staff data for context
const prepareStaffContext = (staffData) => {
  // Calculate staff metrics
  const staffSummary = staffData.map(staff => ({
    id: staff._id,
    name: staff.name,
    salary: staff.salary,
    balance: staff.debitCreditHistory,
    phone: staff.phone,
    email: staff.email,
    status: staff.debitCreditHistory >= 0 ? 'Credit' : 'Debit',
    createdAt: staff.createdAt
  }));

  // Overall summary
  const overallSummary = {
    totalStaff: staffData.length,
    totalSalaryExpense: staffData.reduce((sum, staff) => sum + (staff.salary || 0), 0),
    totalBalance: staffData.reduce((sum, staff) => sum + (staff.debitCreditHistory || 0), 0),
    averageSalary: staffData.length > 0 ? staffData.reduce((sum, staff) => sum + (staff.salary || 0), 0) / staffData.length : 0,
    staffInCredit: staffData.filter(staff => staff.debitCreditHistory >= 0).length,
    staffInDebit: staffData.filter(staff => staff.debitCreditHistory < 0).length,
    highestSalary: Math.max(...staffData.map(staff => staff.salary || 0)),
    lowestSalary: Math.min(...staffData.map(staff => staff.salary || 0)),
    highestBalance: Math.max(...staffData.map(staff => staff.debitCreditHistory || 0)),
    lowestBalance: Math.min(...staffData.map(staff => staff.debitCreditHistory || 0))
  };

  return {
    staffSummary,
    overallSummary,
    rawData: staffData
  };
};

// RAG Query handler for staff data
export const queryStaffData = asyncHandler(async (req, res) => {
  const { query, timeFilter = 'alltime' } = req.body;
  const owner = req.user?._id;
  
  if (!query) {
    throw new ApiError(400, "Query is required");
  }

  if (!owner) {
    throw new ApiError(400, "Unauthorized request");
  }

  // Fetch staff data
  const staffData = await Staff.find({ owner }).sort({ createdAt: -1 });

  if (!staffData || staffData.length === 0) {
    throw new ApiError(404, "No staff data found");
  }

  // Prepare structured context
  const staffContext = prepareStaffContext(staffData);
  
  // Create context string for the AI
  const contextString = `
STAFF DATA SUMMARY:
===================

OVERALL METRICS:
- Total Staff Members: ${staffContext.overallSummary.totalStaff}
- Total Monthly Salary Expense: $${staffContext.overallSummary.totalSalaryExpense.toLocaleString()}
- Total Balance (Credit/Debit): $${staffContext.overallSummary.totalBalance.toLocaleString()}
- Average Salary: $${staffContext.overallSummary.averageSalary.toFixed(2)}
- Staff in Credit: ${staffContext.overallSummary.staffInCredit}
- Staff in Debit: ${staffContext.overallSummary.staffInDebit}
- Highest Salary: $${staffContext.overallSummary.highestSalary.toLocaleString()}
- Lowest Salary: $${staffContext.overallSummary.lowestSalary.toLocaleString()}
- Highest Balance: $${staffContext.overallSummary.highestBalance.toLocaleString()}
- Lowest Balance: $${staffContext.overallSummary.lowestBalance.toLocaleString()}

INDIVIDUAL STAFF DETAILS:
${staffContext.staffSummary.map(staff => `
- ${staff.name}:
  * Salary: $${staff.salary.toLocaleString()}
  * Balance: $${staff.balance.toLocaleString()} (${staff.status})
  * Phone: ${staff.phone}
  * Email: ${staff.email}
  * Joined: ${new Date(staff.createdAt).toDateString()}
`).join('')}

STAFF FINANCIAL STATUS:
${staffContext.staffSummary.map(staff => `
- ${staff.name}: ${staff.status} of $${Math.abs(staff.balance).toLocaleString()}
`).join('')}
  `;

  try {
    // Query Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a staff management analyst. Use the provided staff data to answer questions accurately. 
          Provide specific numbers, insights, and actionable recommendations when possible. 
          Format your response clearly with bullet points or sections when appropriate.
          When discussing finances, differentiate between salary expenses and credit/debit balances.
          If asked about staff performance or recommendations, base it on the available data.
          Always base your answers strictly on the provided data.
          Credit balance means the company owes money to the staff member.
          Debit balance means the staff member owes money to the company.`
        },
        {
          role: "user",
          content: `Based on this staff data:\n\n${contextString}\n\nQuestion: ${query}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    return res.status(200).json(new ApiResponse(200, {
      query,
      response: aiResponse,
      dataContext: {
        totalStaff: staffContext.overallSummary.totalStaff,
        totalSalaryExpense: staffContext.overallSummary.totalSalaryExpense,
        totalBalance: staffContext.overallSummary.totalBalance,
        staffInCredit: staffContext.overallSummary.staffInCredit,
        staffInDebit: staffContext.overallSummary.staffInDebit,
        averageSalary: staffContext.overallSummary.averageSalary
      }
    }, "Staff query processed successfully"));

  } catch (error) {
    console.error('Staff RAG Query Error:', error);
    throw new ApiError(500, "Error processing staff query");
  }
});


export {
    addStaff,
    getStaff,
    staffCredit,
    staffDebit,
    deleteStaff
}