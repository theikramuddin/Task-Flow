const Task = require('../models/Task');
const ProjectMember = require('../models/ProjectMember');

// GET /api/dashboard — aggregated stats for the current user
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Get all project IDs this user belongs to
    const memberships = await ProjectMember.find({ user_id: userId }).select('project_id');
    const projectIds = memberships.map(m => m.project_id);

    const [statusBreakdown, overdueRaw, assignedToMe, recentActivity] = await Promise.all([

      // Tasks by status across all user's projects
      Task.aggregate([
        { $match: { project_id: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Overdue tasks (due_date passed, not done)
      Task.find({
        project_id: { $in: projectIds },
        due_date: { $lt: now },
        status: { $ne: 'done' },
      })
        .populate('assigned_to', 'name email')
        .populate('project_id', 'name')
        .sort({ due_date: 1 })
        .limit(10),

      // Tasks assigned to me
      Task.find({ assigned_to: userId, project_id: { $in: projectIds } })
        .populate('project_id', 'name')
        .sort({ due_date: 1 })
        .limit(10),

      // Recently updated tasks across all projects
      Task.find({ project_id: { $in: projectIds } })
        .populate('assigned_to', 'name email')
        .populate('project_id', 'name')
        .sort({ updatedAt: -1 })
        .limit(8),
    ]);

    // Normalize status breakdown into a clean object
    const statusMap = { todo: 0, in_progress: 0, done: 0 };
    statusBreakdown.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        tasksByStatus: statusMap,
        totalTasks: Object.values(statusMap).reduce((a, b) => a + b, 0),
        overdueTasks: overdueRaw,
        assignedToMe,
        recentActivity,
      },
    });
  } catch (err) { next(err); }
};
