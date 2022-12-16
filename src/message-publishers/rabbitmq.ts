import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { IPublishInput, IPublishOutput, IMessagePublisher, IMessagePublisherConf } from '../types';

export function newRabbitMqMessagePublisher(settings: IMessagePublisherConf): Promise<IMessagePublisher> {

  class RabbitMqMessagePublisher implements IMessagePublisher {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async publish(input: IPublishInput): Promise<IPublishOutput> {
      const func = 'RabbitMqMessagePublisher.publish';
      let success = false, error = '';      

      // TODO: optimize channel creation?
      // ask the connection manager for a ChannelWrapper
      const channelWrapper = this._connection.createChannel();

      // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
      // `sendToQueue()` returns a Promise which is fulfilled or rejected when the message is actually sent or not.
      try {
        // TODO: check queue options
        await channelWrapper.assertQueue(input.queue, { durable: false });

        // publish message
        await channelWrapper.sendToQueue(input.queue, input.payload);
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
          console.error('RabbitMqMessagePublisher.close error', err);
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

  return Promise.resolve(new RabbitMqMessagePublisher(connection));
}
