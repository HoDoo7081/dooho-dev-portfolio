import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateBookingInput = {
  idemKey?: string;
  listingId: number;
  slotId?: number;
  checkIn?: string;
  checkOut?: string;
  pax: number;
  currency: string;
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateBookingInput) {
    if (!input.listingId || !input.pax || !input.currency) {
      throw new BadRequestException('Missing required fields.');
    }
    return await this.prisma.$transaction(async (tx) => {
      if (input.slotId) {
        const slot = await tx.availability_slots.findUnique({ where: { slot_id: input.slotId } });
        if (!slot) throw new BadRequestException('Slot not found');
        if ((slot.seats_total ?? 0) - (slot.seats_reserved ?? 0) < input.pax) {
          throw new BadRequestException('Not enough seats');
        }
      }

      const booking = await tx.bookings.create({
        data: {
          traveler_id: 1, // TODO: replace with auth user
          listing_id: input.listingId,
          slot_id: input.slotId ?? null,
          check_in: input.checkIn ? new Date(input.checkIn) : null,
          check_out: input.checkOut ? new Date(input.checkOut) : null,
          pax: input.pax,
          status: 'PENDING',
          subtotal_amount: 0,
          fees_amount: 0,
          total_amount: 0,
          currency: input.currency,
        },
      });

      if (input.slotId) {
        await tx.availability_slots.update({
          where: { slot_id: input.slotId },
          data: { seats_reserved: { increment: input.pax } },
        });
      }
      return { bookingId: booking.booking_id, status: booking.status };
    });
  }
}
