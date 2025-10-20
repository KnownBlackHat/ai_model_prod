import {Response} from 'express';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function get_messages(id: string, resp: Response) {
  const msgs = await prisma.messages.findMany({
    where: {
      conversationId: id,
    },
    orderBy: {
      conversationId: 'desc',
    },
  });

  return resp.send(msgs);
}
