import express from 'express';
import { createGroup, listGroups, getGroupById, listUsersByGroup, updateGroupMembers } from '../../../../presentation/controllers/GroupController.js';

const router = express.Router();

router.get('/', listGroups);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.get('/:id/users', listUsersByGroup);
router.put('/:id/members', updateGroupMembers);

export default router;
