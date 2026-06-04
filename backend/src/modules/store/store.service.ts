import { prisma } from "../../database/prisma.js";

function toPublicPackage(storePackage: {
  code: string;
  name: string;
  upAmount: number;
  priceCents: number;
  currency: string;
  displayOrder: number;
  metadata: unknown;
}) {
  return {
    code: storePackage.code,
    name: storePackage.name,
    upAmount: storePackage.upAmount,
    priceCents: storePackage.priceCents,
    currency: storePackage.currency,
    displayOrder: storePackage.displayOrder,
    metadata: storePackage.metadata
  };
}

export class StorePackageService {
  async listActivePackages() {
    const packages = await prisma.storePackage.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        {
          displayOrder: "asc"
        },
        {
          upAmount: "asc"
        }
      ]
    });

    return packages.map(toPublicPackage);
  }

  async findActivePackageByCode(code: string) {
    return prisma.storePackage.findFirst({
      where: {
        code,
        isActive: true
      }
    });
  }
}

export const storePackageService = new StorePackageService();
