const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { requireMember } = require('../middleware/projectAuth');
const ctrl = require('../controllers/taskController');

// Nested under /api/projects/:projectId/tasks
router.use(protect);

router.get('/',  requireMember, ctrl.getTasks);
router.post('/',
  requireMember,
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  validate, ctrl.createTask
);

// Standalone task routes mounted at /api/tasks
const standaloneRouter = require('express').Router();
standaloneRouter.use(protect);
standaloneRouter.patch('/:id', ctrl.updateTask);
standaloneRouter.delete('/:id', ctrl.deleteTask);
standaloneRouter.post('/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text required')],
  validate, ctrl.addComment
);
standaloneRouter.delete('/:id/comments/:commentId', ctrl.deleteComment);

module.exports = { nestedRouter: router, standaloneRouter };
