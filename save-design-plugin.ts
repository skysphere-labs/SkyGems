import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function saveDesignPlugin(): Plugin {
  return {
    name: 'save-design',
    configureServer(server) {
      server.middlewares.use('/api/save-design', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { imageUrl, filename } = JSON.parse(body);

            const dir = path.resolve(process.cwd(), 'generated-designs');
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            const filePath = path.join(dir, filename);

            if (imageUrl.startsWith('data:image')) {
              const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
              fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            } else if (imageUrl.startsWith('http')) {
              const response = await fetch(imageUrl);
              const buffer = Buffer.from(await response.arrayBuffer());
              fs.writeFileSync(filePath, buffer);
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid image URL' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: filePath }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });
    },
  };
}
