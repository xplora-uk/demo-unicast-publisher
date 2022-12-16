import { factory } from './factory';

main();

async function main(penv = process.env) {

  const { app, config } = await factory(penv);

  app.listen(config.http.port, () => {
    console.info('unicast-message-publisher is listening at', config.http.port);
  });

}
