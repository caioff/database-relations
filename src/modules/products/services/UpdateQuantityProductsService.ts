/* eslint-disable no-plusplus */
import { inject, injectable } from 'tsyringe';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';
import IUpdateProductsQuantityDTO from '../dtos/IUpdateProductsQuantityDTO';

@injectable()
class UpdateQuantityProductsService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const allProducts = await this.productsRepository.findAllById(products);

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const updateProduct = allProducts.find(p => p.id === product.id);

      if (updateProduct) {
        updateProduct.quantity -= product.quantity;
      }
    }

    const updatedProducts = await this.productsRepository.updateQuantity(
      allProducts,
    );

    return updatedProducts;
  }
}

export default UpdateQuantityProductsService;
