import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
