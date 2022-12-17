export interface IUnicastPublisherSettings {
  kind: 'rabbitmq' | 'redis' | 'kafka' | string;
  conf: IUnicastPublisherConf;
}

export interface IUnicastPublisherConf {
  // TODO: either find common config for different kinds or define separate types for each
  url: string;
  ca?: Array<Buffer>;
}

export interface IUnicastPublisher {
  unicastPublish(input: IUnicastPublishInput): Promise<IUnicastPublishOutput>;
}

export interface IUnicastPublishInput {
  queue  : string;
  payload: string;
}

export interface IUnicastPublishOutput {
  success: boolean;
  error  : string | null;
}
