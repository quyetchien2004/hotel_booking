import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_request, response) => {
  response.json({
    message: 'Backend is running',
    docs: '/api/health',
  });
});

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
