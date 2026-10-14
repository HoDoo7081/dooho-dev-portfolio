import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: any) {
    const where: any = { };
    if (params.type) where.type = params.type;
    if (params.city) where.locations = { city: { contains: params.city, mode: 'insensitive' } };
    if (params.q) where.OR = [
      { title: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
    ];
    if (params.priceMin || params.priceMax) {
      where.base_price = {};
      if (params.priceMin) where.base_price.gte = Number(params.priceMin);
      if (params.priceMax) where.base_price.lte = Number(params.priceMax);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listings.findMany({
        where,
        include: { locations: true, hosts: true },
        take: params.size,
        skip: (params.page - 1) * params.size,
        orderBy: (() => {
          const [col, dir] = params.sort.split(',');
          return { [col]: (dir?.toLowerCase() === 'asc' ? 'asc' : 'desc') };
        })()
      }),
      this.prisma.listings.count({ where }),
    ]);

    return { items, total };
  }
}
