import { Router } from "express";

import { 
  createGroup, 
  listGroups, 
  getGroupById, 
  listUsersByGroup, 
  updateGroupMembers,
  deleteGroup,
  getGroupsByUserRole
} from '../../../../presentation/controllers/GroupController.js';

const router = Router();

router.get('/', listGroups);
router.get('/by-user', getGroupsByUserRole);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.get('/:id/users', listUsersByGroup);
router.put('/:id/members', updateGroupMembers);
router.delete('/:id', deleteGroup);


export default router;
