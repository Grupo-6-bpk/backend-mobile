import express from 'express';
import { createGroup, listGroups, showGroup } from '../../../../presentation/controllers/GroupController.js';

const grouprouter = express.Router();

grouprouter.get('/', listGroups);
grouprouter.post('/', createGroup);
grouprouter.patch('/:id/members', showGroup);

export default grouprouter;
