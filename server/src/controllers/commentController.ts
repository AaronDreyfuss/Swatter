import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { createCommentSchema, updateCommentSchema } from '../schemas/commentSchemas';

const commentController = {
  createComment: async (req: Request, res: Response, next: NextFunction) => {
    const result = createCommentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { content } = result.data;
    const { bugId } = req.params;
    const authorId = req.user!.id;

    try {
      const comment = await prisma.comment.create({
        data: { content, bugId, authorId },
        include: { author: { select: { id: true, email: true } } },
      });

      res.locals.data = comment;
      res.locals.status = 201;
      return next();
    } catch (err) {
      return next(err);
    }
  },
  deleteComment: async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, bugId, commentId } = req.params;
    const userId = req.user!.id;

    try {
      const [comment, member] = await Promise.all([
        prisma.comment.findFirst({ where: { id: commentId, bugId } }),
        prisma.projectMember.findUnique({
          where: { userId_projectId: { userId, projectId } },
        }),
      ]);

      if (!comment) {
        return res.status(404).json({ err: 'Comment not found' });
      }

      if (comment.authorId !== userId && member?.role !== Role.ADMIN) {
        return res.status(403).json({ err: 'Access denied' });
      }

      const deleted = await prisma.comment.delete({ where: { id: commentId } });

      res.locals.data = deleted;
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  updateComment: async (req: Request, res: Response, next: NextFunction) => {
    const result = updateCommentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { content } = result.data;
    const { bugId, commentId } = req.params;
    const userId = req.user!.id;

    try {
      const comment = await prisma.comment.findFirst({ where: { id: commentId, bugId } });

      if (!comment) {
        return res.status(404).json({ err: 'Comment not found' });
      }

      if (comment.authorId !== userId) {
        return res.status(403).json({ err: 'Access denied' });
      }

      const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: { author: { select: { id: true, email: true } } },
      });

      res.locals.data = updated;
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },
};

export default commentController;
