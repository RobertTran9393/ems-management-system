import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const inventoryRouter = Router();

// 1. Get Products with branch stock
inventoryRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        branchStocks: {
          where: branchId ? { branchId: String(branchId) } : undefined,
        },
      },
    });
    return res.json({ success: true, data: products });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Adjust Stock
inventoryRouter.post('/adjust', async (req: Request, res: Response) => {
  try {
    const { branchId, productId, changeQty, actionType, referenceId } = req.body;

    const stock = await prisma.branchStock.upsert({
      where: { branchId_productId: { branchId, productId } },
      update: { quantity: { increment: Number(changeQty) } },
      create: { branchId, productId, quantity: Number(changeQty) },
    });

    await prisma.inventoryLog.create({
      data: {
        branchId,
        productId,
        changeQty: Number(changeQty),
        actionType: actionType || 'ADJUSTMENT',
        referenceId,
      },
    });

    return res.json({ success: true, data: stock });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
