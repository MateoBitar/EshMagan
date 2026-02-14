// src/repositories/alert.repository.js

import { pool } from '../config/db.js';
import { Alert } from '../entities/alert.entity.js';
import { Fire } from '../entities/fire.entity.js';

export class AlertRepository {