import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import UpdateQuantityProductsService from '@modules/products/services/UpdateQuantityProductsService';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsIds = products.map(p => {
      return {
        id: p.id,
      };
    });

    const productsWithPrice = await this.productsRepository.findAllById(
      productsIds,
    );

    const productsData = products.map(product => {
      const productWithPrice = productsWithPrice.find(p => p.id === product.id);

      if (!productWithPrice) {
        throw new AppError('Invalid product id');
      }

      if (productWithPrice.quantity < product.quantity) {
        throw new AppError(`Invalid quantity this product ${product.id}`);
      }

      return {
        product_id: product.id,
        price: productWithPrice.price,
        quantity: product.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsData,
    });

    const updateQuantityProducts = new UpdateQuantityProductsService(
      this.productsRepository,
    );

    await updateQuantityProducts.execute(products);

    return order;
  }
}

export default CreateOrderService;
