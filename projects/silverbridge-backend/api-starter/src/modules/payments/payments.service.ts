import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(body: { bookingId: number; amount: number; currency: string; method?: string }) {
    if (!body.bookingId || !body.amount || !body.currency) {
      throw new BadRequestException('Missing fields');
    }
    const booking = await this.prisma.bookings.findUnique({ where: { booking_id: body.bookingId } });
    if (!booking) throw new BadRequestException('Booking not found');
    const pay = await this.prisma.payments.create({
      data: {
        booking_id: body.bookingId,
        amount: body.amount,
        currency: body.currency,
        method: body.method ?? 'CARD',
        status: 'INITIATED',
      }
    });
    return { paymentId: pay.payment_id, redirectUrl: `https://pay.example.com/checkout/${pay.payment_id}` };
  }

  async handleWebhook(provider: string, payload: any) {
    return { provider, received: true };
  }
}
