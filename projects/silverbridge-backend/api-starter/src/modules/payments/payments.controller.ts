import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ok } from '../../common/utils/response';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('sessions')
  async createSession(@Body() body: { bookingId: number; amount: number; currency: string; method?: string }) {
    const data = await this.svc.createSession(body);
    return ok(data);
  }

  @Post('webhooks/:provider')
  async webhook(@Param('provider') provider: string, @Body() payload: any) {
    const data = await this.svc.handleWebhook(provider, payload);
    return ok(data);
  }
}
