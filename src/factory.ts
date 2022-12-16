import express, { Request, Response } from 'express';
import { newUnicastPublisher } from './unicast-publishers';

const HEADER_APP_ID = 'x-app-id';

export async function factory(penv = process.env) {
  const app = express();

  app.use(express.json({ limit: '1MB' }));

  const config = {
    http: {
      port: Number.parseInt(penv.UCP_HTTP_PORT || '3000'),
    },
    messagePublisher: {
      kind: penv.UCP_KIND || 'rabbitmq',
      conf: {
        hostname : penv.UCP_HOSTNAME || 'localhost',
        port     : Number.parseInt(penv.UCP_PORT || '0'),
        username : penv.UCP_USERNAME || '',
        password : penv.UCP_PASSWORD || '',
        heartbeat: 30,
      },
    },
  };

  const ucPublisher = await newUnicastPublisher(config.messagePublisher);

  async function healthCheck(_req: Request, res: Response) {
    res.json({ status: 'OK', ts: new Date() });
  }

  app.get('/health', healthCheck);

  async function handleQueue(req: Request, res: Response) {
    // TODO: security by API Key?
    try {
      if (typeof req.body !== 'object') throw new Error('valid JSON expected for request body');

      const sender     = req.get(HEADER_APP_ID) || 'unknown'; // TODO: validate sender
      const { queue }  = req.params as Record<string, string>;
      const payloadObj = { meta: { sender, queue }, data: req.body };
      // TODO: validate payloadObj based on the contract for that queue
      const payload = JSON.stringify(payloadObj);
      const result  = await ucPublisher.unicastPublish({ queue, payload });
      res.json(result);
    } catch (err) {
      console.error('unicast-publisher error', err);
      res.json({ error: 'Server error' });
    }
  }

  app.post('/:queue', handleQueue);

  return { app, config, ucPublisher, healthCheck, handleQueue };
}
