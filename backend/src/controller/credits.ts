import {Response} from 'express';
import {prisma} from '../constants';

export async function get_credit(email: string, resp: Response) {
  const credits = await prisma.credits.findUnique({
    where: {
      userEmail: email,
    },
  });
  return resp.send(credits);
}

export async function expend_credit(
  email: string,
  amount: number,
): Promise<boolean> {
  const credit = await prisma.credits.update({
    where: {
      userEmail: email,
    },
    data: {
      credits: {
        decrement: amount,
      },
    },
  });

  if (credit.credits <= 0) {
    return false;
  }
  return true;
}
