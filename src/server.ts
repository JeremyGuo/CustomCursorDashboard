import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'node:path';
import { UserStore } from './lib/userStore';
import { RegistrationStore } from './lib/registrationStore';
import { ServiceRegistry } from './lib/serviceRegistry';
import { buildAuthRouter } from './routes/auth';
import { buildAdminRouter } from './routes/admin';
import { buildServiceApiRouter } from './routes/serviceApi';
import { buildServicePageHandler, buildServiceAssetHandler } from './routes/servicePages';
import { buildServiceProxy } from './routes/serviceProxy';
import { authenticate } from './middleware/authenticate';

async function bootstrap() {
  const app = express();
  const port = Number(process.env.PORT ?? 3100);
  const userStore = new UserStore();
  const registrationStore = new RegistrationStore();
  const serviceRegistry = new ServiceRegistry();
  await userStore.init();
  await registrationStore.init();
  await serviceRegistry.init();

  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cookieParser());
  const publicDir = path.join(process.cwd(), 'public');
  const appEntry = path.join(publicDir, 'app.html');
  app.use('/public', express.static(publicDir));

  app.use('/auth', buildAuthRouter(userStore, registrationStore));
  app.use('/admin', buildAdminRouter(userStore, registrationStore, serviceRegistry));
  app.use('/api/services', buildServiceApiRouter(serviceRegistry));

  app.get('/services-assets/:serviceId/*', authenticate, buildServiceAssetHandler(serviceRegistry));
  app.use('/:serviceId/api', authenticate, buildServiceProxy(serviceRegistry));
  app.get('/:serviceId', authenticate, buildServicePageHandler(serviceRegistry));

  app.get(['/app', '/'], (_req, res) => {
    res.sendFile(appEntry);
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: err.message });
  });

  app.listen(port, () => {
    console.log(`🚀 Dashboard server listening on http://localhost:${port}`);
  });
}

bootstrap();
