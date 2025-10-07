import express from 'express';
import {
  getCurrentUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getUserFoundPosts,
  updateUserFoundPosts,
  getUserLostPosts,
  updateUserLostPosts,
  deleteUserLostPosts,
  deleteUserFoundPosts,
  checkUserActiveStatus
} from '../controllers/user.controllers.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const userRouter = express.Router();

// All routes below are for logged-in users
userRouter.get('/me', authenticate, getCurrentUserProfile);
userRouter.put('/update', authenticate, updateProfile);
userRouter.put('/password', authenticate, changePassword);
userRouter.post('/avatar', authenticate, upload.single("avatar"), uploadAvatar);
userRouter.get('/user/status', authenticate, checkUserActiveStatus);
// lost posts of users
userRouter.get('/user-lost-posts', authenticate, getUserLostPosts);
userRouter.put('/user-lost-update-posts', authenticate, updateUserLostPosts);
userRouter.delete('/user-lost-posts', authenticate, deleteUserLostPosts);
// found posts of users
userRouter.get('/user-found-posts', authenticate, getUserFoundPosts);
userRouter.put('/user-found-update-posts', authenticate, updateUserFoundPosts);
userRouter.delete('/user-found-posts', authenticate, deleteUserFoundPosts);


export default userRouter;
