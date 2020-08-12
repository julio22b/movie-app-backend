import movieListController from '../controllers/movieListController';
import express from 'express';
import passport from 'passport';

const router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/:movieListID/', movieListController.get_list);

router.post('/:userID', movieListController.create_list);

router.put('/:movieListID/', movieListController.edit_list);

router.delete('/:movieListID', movieListController.delete_list);

export default router;
