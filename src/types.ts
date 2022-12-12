export interface IMessagePublisherSettings {
  kind: 'rabbitmq' | 'redis' | 'kafka' | string;
  conf: IMessagePublisherConf;
}

export interface IMessagePublisherConf {
  url     : string;
  username: string;
  password: string;
}

export interface IMessagePublisher {
  publish(message: IMessageInput): Promise<IMessageOutput>;
}

export interface IMessageInput {
  queue  : string;
  payload: string;
}

export interface IMessageOutput {
  success: boolean;
  error  : string | null;
}
