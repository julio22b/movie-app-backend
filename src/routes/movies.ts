import express from 'express';
import movieController from '../controllers/movieController';
import { check } from 'express-validator';
import passport from 'passport';
const router = express.Router();

router.post('/create', [check('*').trim().escape()], movieController.create_movie_instance);

router.put('/:userID/like/:movieID', passport.authenticate('jwt', { session: false }),movieController.like_movie);

router.put('/:userID/unlike/:movieID', passport.authenticate('jwt', { session: false }),movieController.unlike_movie);

router.get('/all', movieController.get_all_movie_instances);

export default router;
