const router = require('express').Router();
const ctrl = require('../controllers/class.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { checkClassAccess, checkMonthAccess } = require('../middleware/access.middleware');

// classes
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.detail);

// onetime content
router.get('/:id/content', authenticate, checkClassAccess, ctrl.content);

router.post('/', authenticate, requireRole('teacher'), ctrl.create);
router.put('/:id', authenticate, requireRole('teacher'), ctrl.update);
router.delete('/:id', authenticate, requireRole('teacher'), ctrl.remove);

// onetime root-level content (rejected for subscription classes)
router.post('/:id/videos', authenticate, requireRole('teacher'), ctrl.addVideo);
router.put('/:id/videos/reorder', authenticate, requireRole('teacher'), ctrl.reorderVideos);
router.delete('/:id/videos/:videoId', authenticate, requireRole('teacher'), ctrl.removeVideo);

router.post('/:id/materials', authenticate, requireRole('teacher'), ctrl.addMaterial);
router.delete('/:id/materials/:materialId', authenticate, requireRole('teacher'), ctrl.removeMaterial);

router.post('/:id/zoom', authenticate, requireRole('teacher'), ctrl.addZoom);
router.delete('/:id/zoom/:zoomId', authenticate, requireRole('teacher'), ctrl.removeZoom);

// month management (subscription)
router.post('/:id/months', authenticate, requireRole('teacher'), ctrl.addMonth);
router.post('/:id/months/bulk', authenticate, requireRole('teacher'), ctrl.bulkCreateMonths);
router.put('/:id/months/:year/:month', authenticate, requireRole('teacher'), ctrl.updateMonth);
router.delete('/:id/months/:year/:month', authenticate, requireRole('teacher'), ctrl.removeMonth);

// per-month content (teacher)
router.post('/:id/months/:year/:month/videos', authenticate, requireRole('teacher'), ctrl.addMonthVideo);
router.put('/:id/months/:year/:month/videos/reorder', authenticate, requireRole('teacher'), ctrl.reorderMonthVideos);
router.delete('/:id/months/:year/:month/videos/:videoId', authenticate, requireRole('teacher'), ctrl.removeMonthVideo);

router.post('/:id/months/:year/:month/materials', authenticate, requireRole('teacher'), ctrl.addMonthMaterial);
router.delete('/:id/months/:year/:month/materials/:materialId', authenticate, requireRole('teacher'), ctrl.removeMonthMaterial);

router.post('/:id/months/:year/:month/zoom', authenticate, requireRole('teacher'), ctrl.addMonthZoom);
router.delete('/:id/months/:year/:month/zoom/:zoomId', authenticate, requireRole('teacher'), ctrl.removeMonthZoom);

// per-month content (student) — gated by access
router.get('/:id/months/:year/:month/content', authenticate, checkMonthAccess, ctrl.monthContent);

module.exports = router;
