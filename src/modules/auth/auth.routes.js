import express from 'express';

import { loginUser, registerUser } from './auth.controller.js';
import { validateLogin, validateRegister } from './auth.validation.js';

export const authRouter = express.Router();

authRouter.post('/register', validateRegister, registerUser)
authRouter.post('/login', validateLogin, loginUser);