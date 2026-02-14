// src/repositories/evacuation.repository.js

import { pool } from '../config/db.js';
import { Evacuation } from '../entities/evacuation.entity.js';
import { Fire } from '../entities/fire.entity.js';

export class EvacuationRepository {