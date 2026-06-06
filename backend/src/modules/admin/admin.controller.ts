import type { FastifyReply, FastifyRequest } from "fastify";

export async function getAdminMeController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  reply.send({
    ok: true,
    role: "ADMIN"
  });
}
