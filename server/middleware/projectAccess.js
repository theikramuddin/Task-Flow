const ProjectMember = require('../models/ProjectMember');

// Attaches req.membership — use this in any project-scoped route
const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;

  const membership = await ProjectMember.findOne({
    project_id: projectId,
    user_id: req.user._id,
  });

  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this project.' });
  }

  req.membership = membership;
  next();
};

// Only project admins (or global admin) can proceed
const requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;

  if (req.user.role === 'admin') return next(); // global admin bypasses

  const membership = await ProjectMember.findOne({
    project_id: projectId,
    user_id: req.user._id,
  });

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ message: 'Project admin access required.' });
  }

  req.membership = membership;
  next();
};

module.exports = { requireProjectMember, requireProjectAdmin };
