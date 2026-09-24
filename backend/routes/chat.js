/* backend/routes/chat.js */
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import chatController from '../controllers/chatController.js';
import { uploadMemory } from '../services/uploadService.js';

const router = express.Router();

router.get('/trainer-info', authenticateToken, chatController.getTrainerInfo);
router.get('/history/:otherUserId', authenticateToken, chatController.getChatHistory);
router.post('/send', authenticateToken, chatController.sendMessage);
router.get('/trainer-chats', authenticateToken, chatController.getTrainerClientsChats);
router.post('/mark-read/:otherUserId', authenticateToken, chatController.markMessagesAsRead);
router.post('/upload', authenticateToken, uploadMemory.single('file'), chatController.uploadAttachment);
router.get('/unread-count', authenticateToken, chatController.getUnreadCount);
router.put('/message/:messageId', authenticateToken, chatController.editMessage);
router.post('/trainer/bot-reminder/:prospectId/:level', authenticateToken, chatController.sendManualBotReminder);
router.post('/trainer/bot-reminder-resend/:prospectId/:level', authenticateToken, chatController.resendBotReminder);

export default router;


