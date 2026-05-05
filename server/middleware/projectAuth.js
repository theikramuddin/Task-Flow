const ProjectMember = require('../models/ProjectMember');

// Attach membership info to req; block non-members
exports.requireMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id || req.body.project_id;

  const membership = await ProjectMember.findOne({
    project_id: projectId,
    user_id: req.user._id,
  });

  if (!membership) {
    return res.status(403).json({ success: false, message: 'You are not a member of this project' });
  }

  req.membership = membership;
  next();
};

// Only project admins can perform the action
exports.requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;

  const membership = await ProjectMember.findOne({
    project_id: projectId,
    user_id: req.user._id,
  });

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only project admins can perform this action' });
  }

  req.membership = membership;
  next();
};
