import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { processChatQuery, generateKpiInsight, generateDashboardInsights } from '../services/ai.service.js';
import { User } from '../models/user.model.js';

// Helper: get user's Gemini API key (returns null if not set, so service falls back to env key)
const getUserApiKey = async (userId) => {
    const user = await User.findById(userId).select('geminiApiKey');
    return user?.geminiApiKey?.trim() || null;
};

/**
 * @route POST /api/v1/ai/chat
 */
export const handleAIChat = asyncHandler(async (req, res) => {
    const { query, history = [] } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) throw new ApiError(401, 'Unauthorized');
    if (!query || typeof query !== 'string' || !query.trim()) {
        throw new ApiError(400, 'A valid query string is required.');
    }

    const sanitizedHistory = Array.isArray(history)
        ? history.filter((m) => m.role && m.text && typeof m.text === 'string').slice(-20)
        : [];

    const userApiKey = await getUserApiKey(ownerId);

    try {
        const result = await processChatQuery(query.trim(), ownerId, sanitizedHistory, userApiKey);
        return res.status(200).json(new ApiResponse(200, result, 'Query processed successfully.'));
    } catch (error) {
        console.error('[AI Chat] Error:', error.message);
        throw new ApiError(500, 'Failed to process AI query. Please try again.');
    }
});

/**
 * @route POST /api/v1/ai/kpi-insight
 */
export const handleKpiInsight = asyncHandler(async (req, res) => {
    const { metricName, historicalData } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) throw new ApiError(401, 'Unauthorized');
    if (!metricName || !historicalData) {
        throw new ApiError(400, 'metricName and historicalData are required.');
    }

    const userApiKey = await getUserApiKey(ownerId);

    try {
        const insightText = await generateKpiInsight(metricName, historicalData, userApiKey);
        return res.status(200).json(new ApiResponse(200, { insight: insightText }, 'KPI Insight generated successfully.'));
    } catch (error) {
        console.error('[KPI Insight] Error:', error.message);
        throw new ApiError(500, 'Failed to generate KPI insight.');
    }
});

/**
 * @route POST /api/v1/ai/dashboard-insights
 * Generates real AI insights for the dashboard InsightsPanel based on live business data
 */
export const handleDashboardInsights = asyncHandler(async (req, res) => {
    const { businessData } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) throw new ApiError(401, 'Unauthorized');
    if (!businessData) throw new ApiError(400, 'businessData is required.');

    const userApiKey = await getUserApiKey(ownerId);

    try {
        const insights = await generateDashboardInsights(businessData, userApiKey);
        return res.status(200).json(new ApiResponse(200, { insights }, 'Dashboard insights generated successfully.'));
    } catch (error) {
        console.error('[Dashboard Insights] Error:', error.message);
        throw new ApiError(500, 'Failed to generate dashboard insights.');
    }
});
