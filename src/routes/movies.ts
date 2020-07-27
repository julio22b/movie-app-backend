import express from 'express';
import movieController from '../controllers/movieController';
import { check } from 'express-validator';
const router = express.Router();

router.post(
    '/create',
    [check(['title', 'year', 'synopsis', 'poster']).trim().escape()],
    movieController.create_movie_instance,
);

router.put('/:id/like', movieController.update_movie_instance_likes);

router.put(
    '/:id/rate',
    [check('rating', 'Rating must be a number').isNumeric().trim().escape()],
    movieController.update_movie_instance_ratings,
);

router.get('/all', movieController.get_all_movie_instances);

export default router;
