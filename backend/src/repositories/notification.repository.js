// src/repositories/notification.repository.js

import { pool } from '../config/db.js';
import { Notification } from '../entities/notification.entity.js';
import { Fire } from '../entities/fire.entity.js';

export class NotificationRepository {