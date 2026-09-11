import { configFromEnvironment, createApp } from './app.mjs';

const config = configFromEnvironment(process.env);
const app = createApp(config);
app.listen(Number(process.env.PORT ?? 8788), '0.0.0.0', () => {
  console.log('Taste Buddy ChatGPT 연결 서버가 시작되었습니다.');
});
