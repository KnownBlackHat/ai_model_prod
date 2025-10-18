import {Db} from 'mongodb';
import {summarizer} from './interaction';

export async function get_gist_name(db: Db, id: string): Promise<string> {
  const collection = db.collection(`his-${id}`);
  // @ts-ignore
  const user: Dblist[] = await collection.find({}).limit(3).toArray();
  const msgs: string[] = [];
  for (const msg of user) {
    msgs.push(msg?.user || '');
  }
  const gist = await summarizer(msgs.join('.'));
  return gist;
}
