import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
})) //use method is used for configuration and middleware major part will be done through app.use(cors()) if u want more options to setting up u may go with the documentation

app.use(express.json({limit:'16kb'})) // we done beacuse we might get diff type of data from forms to servers, we set limit to json so our server do not get crash its important step
app.use(express.urlencoded({ extended: true })); // Explicitly define `extended` option
 // we done this because we can get data from urls also so we need to encode it, also u can use option for further config  
app.use(express.static("public")) // this will store data like pdf,image ... for temp purpose

app.use(cookieParser()) // for reading cookies of user from user's browser and it can set cookies and perform crud ops


import userRouter from "../routes/user.routes.js";
import inventoryRouter from "../routes/inventory.routes.js"
import salesRouter from "../routes/sales.routes.js"
import customerRouter from "../routes/customer.routes.js"
import invoiceRouter from "../routes/invoice.routes.js"
import staffRouter from '../routes/staff.routes.js'
import expenseRouter from "../routes/expense.routes.js"
import notesRouter from "../routes/notes.routes.js"
import ordersRouter from "../routes/orders.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter) // this will become prefix like .../api/v1/users/register
app.use("/api/v1/inventory",inventoryRouter)
app.use("/api/v1/sales",salesRouter) 
app.use("/api/v1/customer",customerRouter)
app.use("/api/v1/invoice",invoiceRouter)
app.use("/api/v1/staff",staffRouter)
app.use("/api/v1/expense",expenseRouter)
app.use("/api/v1/orders",ordersRouter)
app.use("/api/v1/notes",notesRouter)

export {app}