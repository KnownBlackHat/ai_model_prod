import { Response } from 'express';
import { prisma } from '../constants';

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

export async function get_his_messages(id: string) {
  const msgs = await prisma.messages.findMany({
    where: {
      conversationId: id,
    },
    orderBy: {
      conversationId: 'desc',
    },
    take: 20,
  });

  return msgs;
}

export async function add_message(
  id: string,
  msg: string,
  role: 'User' | 'Assistant',
) {
  await prisma.messages.create({
    data: {
      conversationId: id,
      role,
      content: msg,
    },
  });
}
