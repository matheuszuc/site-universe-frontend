import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../database/prisma.js";

export async function getAdminMeController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  reply.send({
    ok: true,
    role: "ADMIN"
  });
}

export async function getAdminUsersController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const users = await prisma.user.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  reply.send({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: Boolean(u.emailVerifiedAt),
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null
    }))
  });
}

export async function getAdminOrdersController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const orders = await prisma.order.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } }
    }
  });

  reply.send({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userName: o.user.name,
      userEmail: o.user.email,
      packageName: o.packageName,
      packageCode: o.packageCode,
      amountCents: o.amountCents,
      currency: o.currency,
      rewardAmount: o.rewardAmount,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      paidAt: o.paidAt?.toISOString() ?? null
    }))
  });
}

export async function getAdminGameDeliveriesController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const deliveries = await prisma.gameDelivery.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } }
    }
  });

  reply.send({
    deliveries: deliveries.map((d) => ({
      id: d.id,
      userName: d.user.name,
      userEmail: d.user.email,
      type: d.type,
      status: d.status,
      rewardTierCode: d.rewardTierCode ?? null,
      attempts: d.attempts,
      lastError: d.lastError ?? null,
      createdAt: d.createdAt.toISOString(),
      deliveredAt: d.deliveredAt?.toISOString() ?? null
    }))
  });
}

export async function getAdminAuditLogsController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const logs = await prisma.paymentAuditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      actorType: true,
      actorId: true,
      eventType: true,
      entityType: true,
      userId: true,
      orderId: true,
      success: true,
      reason: true,
      createdAt: true
    }
  });

  reply.send({
    logs: logs.map((l) => ({
      id: l.id,
      eventType: l.eventType,
      entityType: l.entityType,
      actorType: l.actorType,
      actorId: l.actorId ?? null,
      userId: l.userId ?? null,
      orderId: l.orderId ?? null,
      success: l.success,
      reason: l.reason ?? null,
      createdAt: l.createdAt.toISOString()
    }))
  });
}
