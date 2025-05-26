import { Router } from 'express';
import { refreshToken } from '../controllers/token.controller';


const router = Router();


//If refresh token is valid, user recieves new access and refresh tokens
router.get('/refreshToken', refreshToken);


export default router;