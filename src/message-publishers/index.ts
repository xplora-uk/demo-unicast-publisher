import { IMessagePublisher, IMessagePublisherSettings } from '../types';
import { newRabbitMqMessagePublisher } from './rabbitmq';

export function newMessagePublisher(settings: IMessagePublisherSettings): Promise<IMessagePublisher> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqMessagePublisher(settings.conf);
  }

  throw new Error('Unknown message publisher kind');
}
