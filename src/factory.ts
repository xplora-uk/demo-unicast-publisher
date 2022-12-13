import express from 'express';
import { newMessagePublisher } from './message-publishers';

export async function factory(penv = process.env) {
  const app = express();

  const msgPublisher = await newMessagePublisher({
    kind: penv.MP_KIND || 'rabbitmq',
    conf: {
      hostname : penv.MP_HOSTNAME || 'localhost',
      port     : Number.parseInt(penv.MP_PORT || '0'),
      username : penv.MP_USERNAME || '',
      password : penv.MP_PASSWORD || '',
      heartbeat: 30,
    },
  });

  app.post('/:queue', async (req, res) => {
    try {
      const queue   = String(req.params.queue || '');
      const payload = String(req.body);
      const result  = await msgPublisher.publish({ queue, payload });
      res.json(result);
    } catch (err) {
      console.error('message-publisher error', err);
      res.json({ error: 'Server error' });
    }
  });

  return { app, msgPublisher };
}
