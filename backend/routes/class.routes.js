const router = require('express').Router();
const ctrl = require('../controllers/class.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { checkClassAccess } = require('../middleware/access.middleware');

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.detail);
router.get('/:id/content', authenticate, checkClassAccess, ctrl.content);

router.post('/', authenticate, requireRole('teacher'), ctrl.create);
router.put('/:id', authenticate, requireRole('teacher'), ctrl.update);
router.delete('/:id', authenticate, requireRole('teacher'), ctrl.remove);

router.post('/:id/videos', authenticate, requireRole('teacher'), ctrl.addVideo);
router.put('/:id/videos/reorder', authenticate, requireRole('teacher'), ctrl.reorderVideos);
router.delete('/:id/videos/:videoId', authenticate, requireRole('teacher'), ctrl.removeVideo);

router.post('/:id/materials', authenticate, requireRole('teacher'), ctrl.addMaterial);
router.delete('/:id/materials/:materialId', authenticate, requireRole('teacher'), ctrl.removeMaterial);

router.post('/:id/zoom', authenticate, requireRole('teacher'), ctrl.addZoom);
router.delete('/:id/zoom/:zoomId', authenticate, requireRole('teacher'), ctrl.removeZoom);

module.exports = router;
