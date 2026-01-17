import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Task } from "../models/task.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Deal } from "../models/deal.model.js";

// Get calendar events (tasks + appointments + deals)
const getCalendarEvents = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const { startDate, endDate } = req.query;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const dateFilter = {};
    if (startDate || endDate) {
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }
    }

    // Get tasks
    const taskFilter = { owner: ownerId };
    if (Object.keys(dateFilter).length > 0) {
        taskFilter.dueDate = dateFilter;
    }

    const tasks = await Task.find(taskFilter)
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });

    // Get appointments
    const appointmentFilter = { owner: ownerId };
    if (Object.keys(dateFilter).length > 0) {
        appointmentFilter.startTime = dateFilter;
    }

    const appointments = await Appointment.find(appointmentFilter)
        .populate('customer', 'name email phone')
        .sort({ startTime: 1 });

    // Get deals
    const dealFilter = { owner: ownerId };
    if (Object.keys(dateFilter).length > 0) {
        dealFilter.expectedCloseDate = dateFilter;
    }

    const deals = await Deal.find(dealFilter)
        .populate('customer', 'name email phone')
        .sort({ expectedCloseDate: 1 });

    // Format events for calendar
    const events = [
        ...tasks.map(task => ({
            id: task._id,
            title: task.name,
            start: task.dueDate,
            end: task.dueDate,
            type: 'task',
            priority: task.priority,
            status: task.status,
            description: task.description,
            assignedTo: task.assignedTo,
            allDay: true
        })),
        ...appointments.map(appointment => ({
            id: appointment._id,
            title: appointment.title,
            start: appointment.startTime,
            end: appointment.endTime,
            type: 'appointment',
            appointmentType: appointment.type,
            location: appointment.location,
            description: appointment.description,
            customer: appointment.customer,
            attendees: appointment.attendees,
            allDay: false
        })),
        ...deals.map(deal => ({
            id: deal._id,
            title: deal.title,
            start: deal.expectedCloseDate,
            end: deal.expectedCloseDate,
            type: 'deal',
            dealStatus: deal.status,
            value: deal.value,
            probability: deal.probability,
            description: deal.description,
            customer: deal.customer,
            allDay: true
        }))
    ];

    return res
        .status(200)
        .json(new ApiResponse(200, { events }, "Calendar events retrieved successfully"));
});

export {
    getCalendarEvents
};
