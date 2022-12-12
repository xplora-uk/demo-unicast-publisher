import express from 'express';
import { newMessagePublisher } from './message-publishers';

export async function newHttpServer() {
  const app = express();

  const msgPublisher = await newMessagePublisher({
    kind: process.env.MESSAGE_PUBLISHER_KIND || 'rabbitmq',
    conf: {
      url     : process.env.MESSAGE_PUBLISHER_RABBITMQ_URL || '',
      username: '',
      password: '',
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

  return app;
}
