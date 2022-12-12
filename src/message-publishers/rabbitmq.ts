import amqp from 'amqp-connection-manager';
import { IMessageInput, IMessageOutput, IMessagePublisher, IMessagePublisherConf } from '../types';

export function newRabbitMqMessagePublisher(settings: IMessagePublisherConf): Promise<IMessagePublisher> {

  const connection = amqp.connect(
    {
      url : settings.url,
      //username: settings.username,
      //password: settings.password,
    },
  );

  async function publish(message: IMessageInput): Promise<IMessageOutput> {
    let success = false, error = '';
    // ask the connection manager for a ChannelWrapper
    const channelWrapper = connection.createChannel();
    
    // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
    // `sendToQueue()` returns a Promise which is fulfilled or rejected when the message is actually sent or not.
    try {
      await channelWrapper.assertQueue(message.queue);
      await channelWrapper.sendToQueue(message.queue, message.payload);
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
    }
    return { success, error };
  }

  return Promise.resolve({ publish });
}
