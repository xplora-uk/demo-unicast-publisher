import dotenv from 'dotenv';
import { factory } from './factory';

dotenv.config();
main();

async function main(penv = process.env) {

  const { app, config } = await factory(penv);

  app.listen(config.http.port, () => {
    console.info('unicast-publisher is listening at', config.http.port);
  });

}
