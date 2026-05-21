import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import resend from '../lib/resend';
import { registerSchema } from '../schemas/authSchemas';

const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ err: 'Email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      // crypto.randomInt is cryptographically secure unlike Math.random
      const code = crypto.randomInt(10000, 100000).toString();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          verificationCode: code,
          verificationExpiry: expiry,
        },
      });

      if (process.env.NODE_ENV !== 'test') {
        if (process.env.NODE_ENV === 'production') {
          const { error } = await resend.emails.send({
            from: 'Swatter <noreply@yourdomain.com>',
            to: email,
            subject: 'Your Swatter verification code',
            html: `<p>Your verification code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
          });
          if (error) console.error('Resend error:', error);
        } else {
          const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS },
          });
          await transporter.sendMail({
            from: 'Swatter <noreply@swatter.com>',
            to: email,
            subject: 'Your Swatter verification code',
            html: `<p>Your verification code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
          });
        }
      }

      res.locals.data = { email: user.email };
      res.locals.status = 201;
      return next();
    } catch (err) {
      return next(err);
    }
  },
};

export default authController;
