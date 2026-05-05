const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');

// GET /api/projects — list projects the current user is a member of
exports.getProjects = async (req, res, next) => {
  try {
    const memberships = await ProjectMember.find({ user_id: req.user._id }).select('project_id role');
    const projectIds = memberships.map(m => m.project_id);

    const projects = await Project.find({ _id: { $in: projectIds } })
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    // Attach user's role in each project
    const roleMap = {};
    memberships.forEach(m => { roleMap[m.project_id.toString()] = m.role; });
    const result = projects.map(p => ({ ...p.toObject(), myRole: roleMap[p._id.toString()] }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// POST /api/projects — any authenticated user can create a project
exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({ name, description, created_by: req.user._id });

    // Creator is auto-added as project admin
    await ProjectMember.create({ project_id: project._id, user_id: req.user._id, role: 'admin' });

    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('created_by', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const members = await ProjectMember.find({ project_id: project._id })
      .populate('user_id', 'name email role');

    res.json({ success: true, data: { ...project.toObject(), members } });
  } catch (err) { next(err); }
};

// PATCH /api/projects/:id — project admin only
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/members — project admin only
exports.addMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email' });

    const existing = await ProjectMember.findOne({ project_id: req.params.id, user_id: user._id });
    if (existing) return res.status(409).json({ success: false, message: 'User is already a member' });

    const member = await ProjectMember.create({
      project_id: req.params.id,
      user_id: user._id,
      role,
    });

    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/members/:userId — project admin only
exports.removeMember = async (req, res, next) => {
  try {
    // Prevent removing yourself if you're the only admin
    const admins = await ProjectMember.countDocuments({ project_id: req.params.id, role: 'admin' });
    if (req.params.userId === req.user._id.toString() && admins <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot remove the last project admin' });
    }

    await ProjectMember.findOneAndDelete({ project_id: req.params.id, user_id: req.params.userId });
    res.json({ success: true, message: 'Member removed' });
  } catch (err) { next(err); }
};
