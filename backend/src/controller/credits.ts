import { Db } from 'mongodb';

export async function get_credit(db: Db, username: string): Promise<number> {
  const usersCol = db.collection('users');
  const user = (await usersCol.findOne({
    username,
  })) as {
    username: string;
    password: string;
    credits: number;
  } | null;
  return user?.credits || 0;
}

export async function expend_credit(
  db: Db,
  username: string,
  amount = 1,
): Promise<boolean> {
  const usersCol = db.collection('users');
  const user = (await usersCol.findOne({
    username,
  })) as {
    username: string;
    password: string;
    credits: number;
  } | null;
  if (!user || user.credits < amount) {
    return false;
  }
  await usersCol.updateOne({ username }, { $inc: { credits: -amount } });
  return true;
}
