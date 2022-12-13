import { factory } from './factory';

main();

async function main(penv = process.env) {

  const port = Number.parseInt(penv.MC_HTTP_PORT || '8000');

  const { app } = await factory(penv);

  app.listen(port, () => {
    console.info('message-publisher is listening at', port);
  });

}
