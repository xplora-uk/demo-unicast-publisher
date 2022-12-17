import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { Channel } from 'amqplib';
import { IUnicastPublishInput, IUnicastPublishOutput, IUnicastPublisher, IUnicastPublisherConf } from '../types';

const connMgrOptions = {
  heartbeatIntervalInSeconds: 15,   // default is 5
  reconnectTimeInSeconds    : 15,   // defaults to heartbeatIntervalInSeconds
  connectionOptions         : {
    timeout: 5000,
  },
};

const channelOptions = {
  publishTimeout: 5000,
};

// When RabbitMQ quits or crashes it will forget the queues and messages 
// unless you tell it not to. Two things are required to make sure that messages aren't lost:
// we need to mark both the queue and messages as durable.
// both publisher and consumer MUST have the same setting
const queueOptions = { durable: true };

// publish message and persist; it may not be processed immediately
const messageOptions = { persistent: true };

export class RabbitMqUnicastPublisher implements IUnicastPublisher {

  protected _channels: Record<string, ChannelWrapper> = {};

  constructor(protected _connection: IAmqpConnectionManager) {
    // do nothing
  }

  protected _channelCache(name: string): ChannelWrapper {
    // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
    //if (!this._connection.isConnected) { // NOT connected
    //  this._connection.reconnect();
    //}
    if (!(name in this._channels) || !this._channels[name]) {
      this._channels[name] = this._connection.createChannel({
        ...channelOptions,
        name,
        setup: async (ch: Channel) => {
          return ch.assertQueue(name, queueOptions);
        },
      });
    }
    return this._channels[name];
  }

  async unicastPublish(input: IUnicastPublishInput): Promise<IUnicastPublishOutput> {
    const func = 'RabbitMqUnicastPublisher.unicastPublish';
    let success = false, error = '';      

    try {
      const channelWrapper = this._channelCache(input.queue);
      await channelWrapper.sendToQueue(input.queue, Buffer.from(input.payload, 'utf8'), messageOptions);
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(func, err);
    }      

    return { success, error };
  }

  async close(): Promise<void> {
    try {
      await this._connection.close();
    } catch (err) {
      console.error('RabbitMqUnicastPublisher.close error', err);
    }
  }

}

export function newRabbitMqUnicastPublisher(settings: IUnicastPublisherConf): Promise<IUnicastPublisher> {
  const connection = amqp.connect(settings, connMgrOptions);
  return Promise.resolve(new RabbitMqUnicastPublisher(connection));
}
