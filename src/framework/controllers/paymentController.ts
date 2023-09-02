import { PaymentUseCase } from "core/applications/usecases/paymentUseCase";
import { Request, Response } from "express";


export class PaymentController {

  constructor(private readonly paymentStatusUseCase: PaymentUseCase) { }

  async updatePaymentStatusByNsu(req: Request, res: Response) {
    const body = req.body
    const result = await this.paymentStatusUseCase.updatePaymentStatusByNsu(body);

    res.status(200).json(result);
  }
}
