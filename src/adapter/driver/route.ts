import { CustomerService } from "core/applications/services/customerService";
import express, { Request, Response, NextFunction } from "express";
import "infra/config/mysqlConfig";

import swaggerUi from 'swagger-ui-express';
import swaggerDocs from 'infra/docs/swagger';

import { CustomerRepository } from "adapter/driven/repositories/customerRepository";
import { CustomerController } from "adapter/driver/customerController";
import { ProductRepository } from "adapter/driven/repositories/productRepository";
import { ProductService } from "core/applications/services/productService";
import { ProductController } from "adapter/driver/productController";
import { AddressRepository } from "adapter/driven/repositories/addressRepository";
import { AddressService } from "core/applications/services/addressService";
import { BasketRepository } from "adapter/driven/repositories/basketRepository";
import { BasketService } from "core/applications/services/basketService";
import { BasketController } from "adapter/driver/basketController";
import IPaymentRepository from "core/applications/ports/out/paymentRepository";
import { PaymentRepository } from "adapter/driven/repositories/paymentRepository";
import { IOrderRepository } from "core/applications/ports/out/orderRepository";
import { OrderRepository } from "adapter/driven/repositories/orderRepository";

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
    const addressService = new AddressService(addressRepository);

    const customerRepository = new CustomerRepository();
    const customerService = new CustomerService(customerRepository);
    const customerController = new CustomerController(
      customerService,
      addressService
    );

    const productRepository = new ProductRepository();
    const productService = new ProductService(productRepository);
    const productController = new ProductController(productService);

    const basketRepository: BasketRepository = new BasketRepository()
    const paymentRepository: IPaymentRepository = new PaymentRepository();
    const orderRepository: IOrderRepository = new OrderRepository();
    const basketService = new BasketService(basketRepository, paymentRepository, orderRepository, customerRepository);
    const basketController = new BasketController(basketService);

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

    app.listen(3000, () => console.log("Server is listening on port 3000 \n SWAGGER: http://localhost:3000/docs"));
  }
}
