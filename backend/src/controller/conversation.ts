import jwt from 'jsonwebtoken';
import {Response} from 'express';
import {PrismaClient} from '@prisma/client';
import {summarizer} from './interaction';

const prisma = new PrismaClient();

export async function get_ids(username: string, resp: Response) {
  const user = await prisma.user.findFirst({
    where: {username},
    include: {
      conversations: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    return resp.status(404).send({error: 'User Not Found'});
  }

  const ids_arr = [];
  for (const conv of user.conversations) {
    if (conv.count >= 3) {
      const msgs = await prisma.messages.findMany({
        where: {
          conversationId: conv.id,
          role: 'User',
        },
      });
      const msgs_line = [];
      for (const msg of msgs) {
        msgs_line.push(msg.content);
      }
      const gist = await summarizer(msgs_line.join('. '));
      conv.gist = gist;
      await prisma.conversation.update({
        where: {
          id: conv.id,
        },
        data: {
          gist,
        },
      });
    }

    ids_arr.push({id: conv.id, gist: conv.gist});
  }
  return resp.send(ids_arr);
}
