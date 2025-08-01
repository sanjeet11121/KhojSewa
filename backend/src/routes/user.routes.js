import express from 'express';
import {
  getCurrentUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar
} from '../controllers/user.controllers.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const userRouter = express.Router();

// All routes below are for logged-in users
userRouter.get('/me', authenticate, getCurrentUserProfile);
userRouter.put('/update', authenticate, updateProfile);
userRouter.put('/password', authenticate, changePassword);
userRouter.post('/avatar', authenticate, upload.single("avatar"), uploadAvatar);

export default userRouter;
