import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { FixturesService } from './src/server/fixturesService.ts';

function fixturesApiPlugin(): Plugin {
  let sharedService: FixturesService | null = null;

  return {
    name: 'fixtures-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/fixtures')) {
          return next();
        }

        if (!sharedService) {
          const env = loadEnv(server.config.mode, process.cwd(), '');
          const apiKey = env.CRICKETDATA_API_KEY || env.CRICAPI_KEY || env.CRICKET_DATA_API_KEY || process.env.CRICKETDATA_API_KEY;
          sharedService = new FixturesService({ apiKey });
        }

        const clientIp = req.socket?.remoteAddress || '127.0.0.1';
        const bypassCache = req.headers['cache-control'] === 'no-cache';

        const result = await sharedService.getNextFixture({ clientIp, bypassCache });

        res.statusCode = result.httpStatus;
        for (const [header, value] of Object.entries(result.headers)) {
          res.setHeader(header, value);
        }
        res.end(JSON.stringify(result.body));
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/fixtures')) {
          return next();
        }

        if (!sharedService) {
          const env = loadEnv(server.config.mode, process.cwd(), '');
          const apiKey = env.CRICKETDATA_API_KEY || env.CRICAPI_KEY || env.CRICKET_DATA_API_KEY || process.env.CRICKETDATA_API_KEY;
          sharedService = new FixturesService({ apiKey });
        }

        const clientIp = req.socket?.remoteAddress || '127.0.0.1';
        const bypassCache = req.headers['cache-control'] === 'no-cache';

        const result = await sharedService.getNextFixture({ clientIp, bypassCache });

        res.statusCode = result.httpStatus;
        for (const [header, value] of Object.entries(result.headers)) {
          res.setHeader(header, value);
        }
        res.end(JSON.stringify(result.body));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fixturesApiPlugin()],
});
