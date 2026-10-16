// Composition root of the push server: wires Cloudflare bindings into handlers.
import { handleRequest } from './http/router'

export default {
  fetch(request, env) {
    return handleRequest(request, {
      allowedOrigins: env.ALLOWED_ORIGINS,
      pingDatabase: async () => {
        await env.DB.prepare('SELECT 1').first()
      },
    })
  },
} satisfies ExportedHandler<Env>
