import movieListController from '../controllers/movieListController';
import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get(
    '/:userID/friends',
    passport.authenticate('jwt', { session: false }),
    movieListController.get_lists_by_friends,
);

router.get('/:movieListID/', movieListController.get_list);

router.post(
    '/:userID',
    passport.authenticate('jwt', { session: false }),
    movieListController.create_list,
);

router.put(
    '/:movieListID',
    passport.authenticate('jwt', { session: false }),
    movieListController.edit_list,
);

router.delete(
    '/:movieListID',
    passport.authenticate('jwt', { session: false }),
    movieListController.delete_list,
);

export default router;
