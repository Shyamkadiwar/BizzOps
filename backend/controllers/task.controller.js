import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Task } from "../models/task.model.js";

// Create new task
const createTask = asyncHandler(async (req, res) => {
    const { name, description, priority, status, dueDate, assignedTo, subtasks, tags } = req.body;
    const owner = req.user?._id;

    if (!name || !dueDate) {
        throw new ApiError(400, "Name and due date are required");
    }
    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const task = await Task.create({
        name,
        description,
        priority: priority || 'Medium',
        status: status || 'Not Started',
        dueDate,
        assignedTo,
        subtasks: subtasks || [],
        tags: tags || [],
        owner
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');

    return res
        .status(201)
        .json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

// Get all tasks for user
const getTasks = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;
    const { status, priority } = req.query;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const filter = { owner: ownerId };
    if (status) {
        filter.status = status;
    }
    if (priority) {
        filter.priority = priority;
    }

    const tasks = await Task.find(filter)
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });

    // Group tasks by status for Kanban view
    const groupedTasks = {
        'Not Started': [],
        'In Progress': [],
        'Waiting': [],
        'Done': []
    };

    tasks.forEach(task => {
        if (groupedTasks[task.status]) {
            groupedTasks[task.status].push(task);
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { tasks, groupedTasks }, "Tasks retrieved successfully"));
});

// Get task by ID
const getTaskById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const task = await Task.findOne({ _id: id, owner: ownerId })
        .populate('assignedTo', 'name email');

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task retrieved successfully"));
});

// Update task
const updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;
    const updateData = req.body;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const task = await Task.findOneAndUpdate(
        { _id: id, owner: ownerId },
        updateData,
        { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task updated successfully"));
});

// Update task status (for drag-and-drop)
const updateTaskStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!status || !['Not Started', 'In Progress', 'Waiting', 'Done'].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const task = await Task.findOneAndUpdate(
        { _id: id, owner: ownerId },
        { status },
        { new: true }
    ).populate('assignedTo', 'name email');

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task status updated successfully"));
});

// Delete task
const deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const deletedTask = await Task.findOneAndDelete({ _id: id, owner: ownerId });

    if (!deletedTask) {
        throw new ApiError(404, "Task not found or unauthorized");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Task deleted successfully"));
});

// Get task statistics
const getTaskStats = asyncHandler(async (req, res) => {
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const tasks = await Task.find({ owner: ownerId });

    const stats = {
        total: tasks.length,
        byStatus: {
            'Not Started': 0,
            'In Progress': 0,
            'Waiting': 0,
            'Done': 0
        },
        byPriority: {
            'Low': 0,
            'Medium': 0,
            'High': 0,
            'Urgent': 0
        },
        overdue: 0
    };

    const now = new Date();
    tasks.forEach(task => {
        stats.byStatus[task.status]++;
        stats.byPriority[task.priority]++;
        if (task.dueDate < now && task.status !== 'Done') {
            stats.overdue++;
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Task statistics retrieved successfully"));
});

export {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskStats
};
