const Task = require('../models/Task');
const ProjectMember = require('../models/ProjectMember');

// GET /api/projects/:projectId/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, assigned_to } = req.query;
    const filter = { project_id: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigned_to) filter.assigned_to = assigned_to;

    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assigned_to, priority, due_date } = req.body;
    const projectId = req.params.projectId;

    // Validate assignee is a project member
    if (assigned_to) {
      const isMember = await ProjectMember.findOne({ project_id: projectId, user_id: assigned_to });
      if (!isMember) return res.status(400).json({ success: false, message: 'Assignee is not a project member' });
    }

    const task = await Task.create({
      title, description, assigned_to, priority, due_date,
      project_id: projectId,
      created_by: req.user._id,
    });

    await task.populate(['assigned_to', 'created_by']);
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id — member can update status; admin can update everything
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const membership = await ProjectMember.findOne({ project_id: task.project_id, user_id: req.user._id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a project member' });

    const { title, description, assigned_to, status, priority, due_date } = req.body;

    // Members can only change status; admins can change everything
    if (membership.role === 'member') {
      if (status) task.status = status;
    } else {
      if (title)       task.title = title;
      if (description !== undefined) task.description = description;
      if (assigned_to !== undefined) task.assigned_to = assigned_to;
      if (status)      task.status = status;
      if (priority)    task.priority = priority;
      if (due_date !== undefined) task.due_date = due_date;
    }

    await task.save();
    await task.populate(['assigned_to', 'created_by']);
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id — project admin only
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const membership = await ProjectMember.findOne({ project_id: task.project_id, user_id: req.user._id });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admins can delete tasks' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
};

// POST /api/tasks/:id/comments — any project member
exports.addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const membership = await ProjectMember.findOne({ project_id: task.project_id, user_id: req.user._id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a project member' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email');

    const newComment = task.comments[task.comments.length - 1];
    res.status(201).json({ success: true, data: newComment });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id/comments/:commentId — comment owner or project admin
exports.deleteComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const membership = await ProjectMember.findOne({ project_id: task.project_id, user_id: req.user._id });
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = membership?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await task.save();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
};
