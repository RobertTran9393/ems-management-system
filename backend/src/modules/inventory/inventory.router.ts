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

// 3. Create Product (Thêm sản phẩm / giáo trình / giáo cụ)
inventoryRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const { sku, name, unit, costPrice, sellingPrice, initialQty, branchId } = req.body;
    const product = await prisma.product.create({
      data: {
        sku: String(sku).trim().toUpperCase(),
        name,
        unit: unit || 'Cái',
        costPrice: Number(costPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
        status: 'ACTIVE',
      },
    });

    if (initialQty && Number(initialQty) > 0 && branchId) {
      await prisma.branchStock.create({
        data: {
          branchId,
          productId: product.id,
          quantity: Number(initialQty),
        },
      });
      await prisma.inventoryLog.create({
        data: {
          branchId,
          productId: product.id,
          changeQty: Number(initialQty),
          actionType: 'INITIAL_STOCK',
        },
      });
    }

    return res.json({ success: true, data: product, message: 'Thêm sản phẩm thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Update Product (Cập nhật giá bán, giá vốn, thông tin sản phẩm)
inventoryRouter.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, unit, costPrice, sellingPrice, status } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) updateData.sellingPrice = Number(sellingPrice);
    if (status !== undefined) updateData.status = status;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    return res.json({ success: true, data: product, message: 'Cập nhật sản phẩm thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Inactivate / Delete Product
inventoryRouter.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return res.json({ success: true, message: 'Đã chuyển sản phẩm sang Ngưng kinh doanh' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Set Opening Stock Balance (Khai báo Tồn Kho Đầu Kỳ)
inventoryRouter.post('/opening-stock', async (req: Request, res: Response) => {
  try {
    const { branchId, items, notes } = req.body;
    if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'branchId và danh sách items (mặt hàng) là bắt buộc' });
    }

    const updatedItems = [];
    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId) continue;

      const newQty = Math.max(0, Number(quantity) || 0);

      // Check current stock
      const existingStock = await prisma.branchStock.findUnique({
        where: { branchId_productId: { branchId, productId } },
      });

      const oldQty = existingStock?.quantity || 0;
      const diff = newQty - oldQty;

      const stock = await prisma.branchStock.upsert({
        where: { branchId_productId: { branchId, productId } },
        update: { quantity: newQty },
        create: { branchId, productId, quantity: newQty },
      });

      await prisma.inventoryLog.create({
        data: {
          branchId,
          productId,
          changeQty: diff,
          actionType: 'OPENING_BALANCE',
          referenceId: notes || 'Khai báo tồn kho đầu kỳ',
        },
      });

      updatedItems.push(stock);
    }

    return res.json({
      success: true,
      message: `Đã thiết lập tồn kho đầu kỳ cho ${updatedItems.length} mặt hàng thành công!`,
      data: updatedItems,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Get Inventory Logs
inventoryRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const { branchId, productId, actionType } = req.query;
    const logs = await prisma.inventoryLog.findMany({
      where: {
        branchId: branchId ? String(branchId) : undefined,
        productId: productId ? String(productId) : undefined,
        actionType: actionType ? String(actionType) : undefined,
      },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

