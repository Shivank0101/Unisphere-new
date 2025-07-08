import express from 'express';
const router = express.Router();
import {
  getEvents,
  createEvent,
  deleteEvent,
  searchEvents,
  getEventById,
  updateEvent,
  getEventsByClub,
  getEventsByOrganizer,
  getUpcomingEvents,
  deactivateEvent
} from '../controllers/event.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

// Public routes
router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/search', searchEvents);
router.get('/club/:clubId', getEventsByClub);
router.get('/organizer/:organizerId', getEventsByOrganizer);
router.get('/:id', getEventById);

// Protected routes (require authentication)
router.post('/', verifyJWT, upload.single('image'), createEvent);
router.put('/:id', verifyJWT, upload.single('image'), updateEvent);
router.put('/deactivate/:id', verifyJWT, deactivateEvent);

router.delete('/:id', verifyJWT, deleteEvent);

export default router;