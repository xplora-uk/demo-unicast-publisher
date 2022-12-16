import { IUnicastPublisher, IUnicastPublisherSettings } from '../types';
import { newRabbitMqUnicastPublisher } from './rabbitmq';

export function newUnicastPublisher(settings: IUnicastPublisherSettings): Promise<IUnicastPublisher> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqUnicastPublisher(settings.conf);
  }

  throw new Error('Unknown unicast message publisher kind');
}
