import express, { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { newUnicastPublisher } from './unicast-publishers';

const HEADER_APP_ID = 'x-app-id';
const HEADER_REQ_ID = 'x-request-id';
const HEADER_DATE   = 'x-date';

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
        url: penv.UCP_URL || 'amqp://localhost:5672',
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
      console.info('new request', req.path, req.body, req.headers);
      if (typeof req.body !== 'object') throw new Error('valid JSON expected for request body');

      // TODO: validate sender
      const sender = req.get(HEADER_APP_ID) || 'unknown';
      const id     = req.get(HEADER_REQ_ID) || randomUUID();
      const date   = req.get(HEADER_DATE) || (new Date()).toISOString();

      const { queue } = req.params as Record<string, string>;

      // TODO: validate payloadObj based on the contract for that queue
      const payloadObj = { meta: { sender, id, date, queue }, data: req.body };

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
