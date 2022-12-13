export interface IMessagePublisherSettings {
  kind: 'rabbitmq' | 'redis' | 'kafka' | string;
  conf: IMessagePublisherConf;
}

export interface IMessagePublisherConf {
  // TODO: either find common config for different kinds or define separate types for each
  //url     : string;
  protocol?: string; // amqp, amqps, 
  username : string;
  password : string;
  hostname : string;
  port     : number;
  vhost?   : string;
  locale?  : string;
  ca?      : Array<Buffer>;
  heartbeat: number;
}

export interface IMessagePublisher {
  publish(input: IPublishInput): Promise<IPublishOutput>;
}

export interface IPublishInput {
  queue  : string;
  payload: string;
}

export interface IPublishOutput {
  success: boolean;
  error  : string | null;
}
