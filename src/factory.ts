import express, { Request, Response } from 'express';
import { newMessagePublisher } from './message-publishers';

export async function factory(penv = process.env) {
  const app = express();

  // TODO: security by API Key?

  app.use(express.text({ limit: '1MB' }));
  app.use(express.json({ limit: '1MB' }));

  const config = {
    http: {
      port: Number.parseInt(penv.MB_HTTP_PORT || '3000'),
    },
    messagePublisher: {
      kind: penv.MP_KIND || 'rabbitmq',
      conf: {
        hostname : penv.MP_HOSTNAME || 'localhost',
        port     : Number.parseInt(penv.MP_PORT || '0'),
        username : penv.MP_USERNAME || '',
        password : penv.MP_PASSWORD || '',
        heartbeat: 30,
      },
    },
  };

  const msgPublisher = await newMessagePublisher(config.messagePublisher);

  async function healthCheck(_req: Request, res: Response) {
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  async function handleQueue(req: Request, res: Response) {
    try {
      const { queue } = req.params as Record<string, string>;
      // TODO: validate req.body based on the contract for that queue
      const payload  = JSON.stringify(req.body);
      const result   = await msgPublisher.publish({ queue, payload });
      res.json(result);
    } catch (err) {
      console.error('message-publisher error', err);
      res.json({ error: 'Server error' });
    }
  }

  app.post('/:queue', handleQueue);

  return { app, config, msgPublisher, healthCheck, handleQueue };
}
