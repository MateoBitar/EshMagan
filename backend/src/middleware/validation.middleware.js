// src/api/middleware/validation.middleware.js

import { body, param } from 'express-validator';

// AUTH VALIDATORS
export const registerValidator = [
    body('user_email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email must be a valid email address'),

    body('user_password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    body('user_phone')
        .notEmpty().withMessage('Phone is required')
        .isMobilePhone().withMessage('Phone must be a valid phone number'),

    body('user_role')
        .notEmpty().withMessage('Role is required')
        .isIn(['Resident', 'Responder', 'Municipality', 'Admin'])
        .withMessage('Role must be one of: Resident, Responder, Municipality, Admin'),
];

export const loginValidator = [
    body('user_email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email must be a valid email address'),

    body('user_password')
        .notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required'),
];

export const logoutValidator = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required'),
];

export const changePasswordValidator = [
    body('old_password')
        .notEmpty().withMessage('Old password is required'),

    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .custom((value, { req }) => {
            if (value === req.body.old_password) {
                throw new Error('New password must be different from old password');
            }
            return true;
        }),
];
