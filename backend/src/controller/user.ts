import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { prisma } from '../constants';

const secret = process.env.JWT_SECRET || '';

export async function signup(
  subid: string,
  email: string,
  username: string,
  res: Response,
) {
  try {
    await prisma.user.create({
      data: {
        subid,
        email,
        username,
      },
    });
    await prisma.credits.create({
      data: {
        userEmail: email,
      },
    });
    return res.send({
      status: 'ok',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).send({
        error: 'Account already exsists',
      });
    } else {
      return res.status(400).send({
        error: 'Bad request',
      });
    }
  }
}

export async function login(email: string, subid: string, resp: Response) {
  const user = await prisma.user.findFirst({
    where: { email, subid },
  });
  if (user) {
    const token = jwt.sign({ email: user?.email }, secret, { expiresIn: '7d' });
    return resp.send({ token });
  } else {
    return resp.status(404).send({
      error: 'User Not Found',
    });
  }
}
