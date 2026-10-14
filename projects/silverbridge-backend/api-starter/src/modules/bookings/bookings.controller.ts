import { Body, Controller, Headers, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ok } from '../../common/utils/response';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('v1/bookings')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  @Post()
  async create(
    @Headers('Idempotency-Key') idemKey: string,
    @Body() body: { listingId: number; slotId?: number; checkIn?: string; checkOut?: string; pax: number; currency: string }
  ) {
    const data = await this.svc.create({ idemKey, ...body });
    return ok(data);
  }
}
