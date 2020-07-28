import movieListController from '../controllers/movieListController';
import express from 'express';

const router = express.Router();

router.get('/:movieListID/all', movieListController.get_movies_from_list);

router.post('/create/:userID', movieListController.create_list);

router.put('/:movieListID/add-movie/:movieID', movieListController.add_movie_to_list);

router.put('/"movieListID/remove-movie/:movieID', movieListController.remove_movie_from_list);

export default router;
