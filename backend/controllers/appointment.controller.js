import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Appointment } from "../models/appointment.model.js";

// Create new appointment
const createAppointment = asyncHandler(async (req, res) => {
    const { title, description, startTime, endTime, location, attendees, customer, type, reminder } = req.body;
    const owner = req.user?._id;

    if (!title || !startTime || !endTime) {
        throw new ApiError(400, "Title, start time, and end time are required");
    }
    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Validate time
    if (new Date(endTime) <= new Date(startTime)) {
        throw new ApiError(400, "End time must be after start time");
    }

    const appointment = await Appointment.create({
        title,
        description,
        startTime,
        endTime,
        location,
        attendees: attendees || [],
        customer,
        type: type || 'Meeting',
        reminder: reminder || 15,
        owner
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('customer', 'name email phone');

    return res
        .status(201)
        .json(new ApiResponse(201, populatedAppointment, "Appointment created successfully"));
});

// Get all appointments for user
const getAppointments = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const { startDate, endDate, type } = req.query;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const filter = { owner: ownerId };

    // Filter by date range
    if (startDate || endDate) {
        filter.startTime = {};
        if (startDate) {
            filter.startTime.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.startTime.$lte = new Date(endDate);
        }
    }

    // Filter by type
    if (type) {
        filter.type = type;
    }

    const appointments = await Appointment.find(filter)
        .populate('customer', 'name email phone')
        .sort({ startTime: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, { appointments }, "Appointments retrieved successfully"));
});

// Get appointment by ID
const getAppointmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const appointment = await Appointment.findOne({ _id: id, owner: ownerId })
        .populate('customer', 'name email phone address');

    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, appointment, "Appointment retrieved successfully"));
});

// Update appointment
const updateAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;
    const updateData = req.body;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Validate time if both are provided
    if (updateData.startTime && updateData.endTime) {
        if (new Date(updateData.endTime) <= new Date(updateData.startTime)) {
            throw new ApiError(400, "End time must be after start time");
        }
    }

    const appointment = await Appointment.findOneAndUpdate(
        { _id: id, owner: ownerId },
        updateData,
        { new: true, runValidators: true }
    ).populate('customer', 'name email phone');

    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, appointment, "Appointment updated successfully"));
});

// Delete appointment
const deleteAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deletedAppointment = await Appointment.findOneAndDelete({ _id: id, owner: ownerId });

    if (!deletedAppointment) {
        throw new ApiError(404, "Appointment not found or unauthorized");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Appointment deleted successfully"));
});

export {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
};
