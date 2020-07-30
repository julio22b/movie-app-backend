import movieListController from '../controllers/movieListController';
import express from 'express';
import passport from 'passport';

const router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/:movieListID/all', movieListController.get_movies_from_list);

router.post('/create/:userID', movieListController.create_list);

router.put('/:movieListID/add-movie/:movieID', movieListController.add_movie_to_list);

router.put('/:movieListID/remove-movie/:movieID', movieListController.remove_movie_from_list);

router.delete('/:movieListID', movieListController.delete_list);

export default router;
