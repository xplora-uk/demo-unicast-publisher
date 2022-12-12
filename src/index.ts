import { newHttpServer } from './http-server';

main();

async function main() {

  const port = 8000;

  const app = await newHttpServer();

  app.listen(port, () => {
    console.info('message-publisher is ready at', port);
  });

}
