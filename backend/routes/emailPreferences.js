import express from 'express';
import emailPreferencesController from '../controllers/emailPreferencesController.js';

const router = express.Router();

router.get('/unsubscribe', emailPreferencesController.showUnsubscribeConfirmation);
router.post('/unsubscribe', emailPreferencesController.unsubscribeOptionalEmails);

export default router;
