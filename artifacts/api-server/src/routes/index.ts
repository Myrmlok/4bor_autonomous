import { Router } from 'express';
import healthRouter   from './health.js';
import authRouter     from './auth.js';
import catalogRouter  from './catalog.js';
import forumRouter    from './forum.js';
import cartRouter     from './cart.js';
import invitesRouter  from './invites.js';
import adminRouter    from './admin.js';
import stickersRouter from './stickers.js';

const router = Router();

router.use(healthRouter);
router.use('/auth',     authRouter);
router.use('/catalog',  catalogRouter);
router.use('/lots',     catalogRouter);   // /api/lots/* also served via catalogRouter
router.use('/forum',    forumRouter);
router.use('/cart',     cartRouter);
router.use('/invites',  invitesRouter);
router.use('/admin',    adminRouter);
router.use('/stickers', stickersRouter);

export default router;
