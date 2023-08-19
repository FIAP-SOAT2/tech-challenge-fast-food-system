
import express, { Request, Response, NextFunction } from "express";
import "infra/persistence/config/mysqlConfig";

import swaggerUi from 'swagger-ui-express';
import swaggerDocs from 'infra/docs/swagger';
import { AddressUseCase } from "core/applications/usecases/addressUseCase";
import { CustomerRepository } from "infra/persistence/repositories/customerRepository";
import { CustomerUseCase } from "core/applications/usecases/customerUseCase";
import { CustomerController } from "./controllers/customerController";
import { ProductRepository } from "infra/persistence/repositories/productRepository";
import { ProductUseCase } from "core/applications/usecases/productUseCase";
import { ProductController } from "./controllers/productController";
import { BasketRepository } from "infra/persistence/repositories/basketRepository";
import { PaymentRepository } from "infra/persistence/repositories/paymentRepository";
import { OrderRepository } from "infra/persistence/repositories/orderRepository";
import IPaymentRepository from "core/domain/repositories/paymentRepository";
import { IOrderRepository } from "core/domain/repositories/orderRepository";
import { BasketUseCase } from "core/applications/usecases/basketUseCase";
import { AddressRepository } from "infra/persistence/repositories/addressRepository";
import { BasketController } from "./controllers/basketController";
import { OrderController } from "./controllers/orderController";
import { OrderUseCase } from "core/applications/usecases/orderUseCase";
import { StatusRepository } from "infra/persistence/repositories/statusRepository";
import { StatusUseCase } from "core/applications/usecases/statusUseCase";
import { StatusController } from "./controllers/statusController";

export interface Error {
  message?: string
}
export class Route {
  static async asyncWrapper(
    req: Request,
    res: Response,
    next: NextFunction,
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ): Promise<void> {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error("Error:", error);
      if (res.headersSent) {
        return;

      }

      const errorValue = error as Error
      const { message } = errorValue

      if (message) {
        res.status(400).json({ error: [message] });
      } else {
        res.status(500).json({ error: ["Internal Server Error"] });
      }
    }
  }

  static Setup() {
    const addressRepository = new AddressRepository();
    const addressUseCase = new AddressUseCase(addressRepository);

    const customerRepository = new CustomerRepository();
    const customerUseCase = new CustomerUseCase(customerRepository);
    const customerController = new CustomerController(
      customerUseCase,
      addressUseCase
    );

    const productRepository = new ProductRepository();
    const productUseCase = new ProductUseCase(productRepository);
    const productController = new ProductController(productUseCase);

    const basketRepository: BasketRepository = new BasketRepository()
    const paymentRepository: IPaymentRepository = new PaymentRepository();
    const orderRepository: IOrderRepository = new OrderRepository();
    const statusRepository = new StatusRepository();
    const basketService = new BasketUseCase(
      basketRepository,
      paymentRepository,
      orderRepository,
      customerRepository,
      statusRepository,
    );
    const basketController = new BasketController(basketService);
      
    const orderUseCase = new OrderUseCase(orderRepository);
    const orderController = new OrderController(orderUseCase);

    const statusUseCase = new StatusUseCase(statusRepository);
    const statusController = new StatusController(statusUseCase);
  
    const app = express();
    app.use(express.json());

    app.use('/docs', swaggerUi.serve);
    app.get('/docs', swaggerUi.setup(swaggerDocs));

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error("Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/customers", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, customerController.addCustomer.bind(customerController));
    });
    app.get("/customers/:document", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, customerController.getCustomerByDocument.bind(customerController));
    });
    app.post("/products", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, productController.addProduct.bind(productController));
    });
    app.get("/products/:id", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, productController.getProductById.bind(productController));
    });
    app.get("/products", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, productController.getAllProduct.bind(productController));
    });
    app.put("/products/:id", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, productController.putProductById.bind(productController));
    });
    app.delete("/products/:id", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, productController.deleteProductById.bind(productController));
    });
    app.post("/checkout", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, basketController.create.bind(basketController));
    });
    app.get("/checkout/pending", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, basketController.getAllPendingOrders.bind(basketController));
    });
    app.get("/orders", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, orderController.getAllOrder.bind(orderController));
    });
    app.get("/status", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, statusController.getAllStatus.bind(statusController));
    });
    app.post("/status", async (req, resp, next) => {
      await Route.asyncWrapper(req, resp, next, statusController.addStatus.bind(statusController));
    });

    app.listen(3000, () => console.log("Server is listening on port 3000 \n SWAGGER: http://localhost:3000/docs"));
  }
}
