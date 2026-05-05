const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { requireProjectAdmin, requireMember } = require('../middleware/projectAuth');
const ctrl = require('../controllers/projectController');

router.use(protect); // All project routes require login

router.get('/',    ctrl.getProjects);
router.post('/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  validate, ctrl.createProject
);

router.get('/:id',   requireMember, ctrl.getProject);
router.patch('/:id', requireProjectAdmin, ctrl.updateProject);

// Member management
router.post('/:id/members',
  requireProjectAdmin,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  validate, ctrl.addMember
);

router.delete('/:id/members/:userId', requireProjectAdmin, ctrl.removeMember);

module.exports = router;
