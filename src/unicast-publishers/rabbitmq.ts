import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { IUnicastPublishInput, IUnicastPublishOutput, IUnicastPublisher, IUnicastPublisherConf } from '../types';

export function newRabbitMqUnicastPublisher(settings: IUnicastPublisherConf): Promise<IUnicastPublisher> {

  // When RabbitMQ quits or crashes it will forget the queues and messages 
  // unless you tell it not to. Two things are required to make sure that messages aren't lost:
  // we need to mark both the queue and messages as durable.
  // both publisher and consumer MUST have the same setting
  const queueOptions   = { durable: true };
  const messageOptions = { persistent: true };

  class RabbitMqUnicastPublisher implements IUnicastPublisher {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async unicastPublish(input: IUnicastPublishInput): Promise<IUnicastPublishOutput> {
      const func = 'RabbitMqUnicastPublisher.unicastPublish';
      let success = false, error = '';      

      // TODO: optimize channel creation?
      // ask the connection manager for a ChannelWrapper
      const channelWrapper = this._connection.createChannel();

      // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
      // `sendToQueue()` returns a Promise which is fulfilled or rejected when the message is actually sent or not.
      try {
        // our queues are durable
        await channelWrapper.assertQueue(input.queue, queueOptions);

        // publish message and persist; it may not be processed immediately
        await channelWrapper.sendToQueue(input.queue, Buffer.from(input.payload, 'utf8'), messageOptions);
        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(func, err);
      } finally {
        channelWrapper.close().catch(() => {}); // no op
      }      

      return { success, error };
    }

    async close(): Promise<void> {
      if (this._connection) {
        try {
          await this._connection.close();
        } catch (err) {
          console.error('RabbitMqUnicastPublisher.close error', err);
        }
      }
    }

  }

  const connection = amqp.connect(
    {
      ...settings,
      connectionOptions: {
        timeout: 5000,
      },
    },
  );

  return Promise.resolve(new RabbitMqUnicastPublisher(connection));
}
