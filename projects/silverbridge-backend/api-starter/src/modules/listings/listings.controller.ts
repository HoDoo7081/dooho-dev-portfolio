import { Controller, Get, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ok } from '../../common/utils/response';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('listings')
@Controller('v1/listings')
export class ListingsController {
  constructor(private readonly svc: ListingsService) {}

  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'priceMin', required: false })
  @ApiQuery({ name: 'priceMax', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiQuery({ name: 'sort', required: false, example: 'created_at,desc' })
  async search(
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('type') type?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('page') page = '1',
    @Query('size') size = '20',
    @Query('sort') sort = 'created_at,desc',
  ) {
    const data = await this.svc.search({ q, city, type, priceMin, priceMax, page: +page, size: +size, sort });
    return ok({ page: +page, size: +size, total: data.total, data: data.items });
  }
}
