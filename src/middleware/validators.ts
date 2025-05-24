import { body } from 'express-validator';

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('invalid-username-length')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('invalid-username'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('invalid-email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('invalid-password-length')
    .matches(/\d/)
    .withMessage('invalid-password-number')
    .matches(/[a-zA-Z]/)
    .withMessage('invalid-password-letter')
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('invalid-email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('invalid-password')
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('invalid-password'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('invalid-password-length')
    .matches(/\d/)
    .withMessage('invalid-password-number')
    .matches(/[a-zA-Z]/)
    .withMessage('invalid-password-letter')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('new-password-same');
      }
      return true;
    })
    .withMessage('new-password-same')
]; 