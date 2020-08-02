import express from 'express';
import movieController from '../controllers/movieController';
import { check } from 'express-validator';
import passport from 'passport';
const router = express.Router();

router.use(passport.authenticate('jwt', { session: false }));

router.post('/create', [check('*').trim().escape()], movieController.create_movie_instance);

router.put('/:id/like', movieController.update_movie_instance_likes);

router.get('/all', movieController.get_all_movie_instances);

export default router;
