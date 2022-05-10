// import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
  type: string;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const validateStock = async (productId: Number) => {
    const stock: any = await api.get('http://localhost:3333/stock');
    const stockProduct = stock.data.find((product: any) => product.id === productId);
    if (stockProduct && stockProduct.amount === 0) {
      toast.error('Quantidade solicitada fora de estoque');
      return;
    }
    return stockProduct;
  }

  const updatedStock = async (stockProduct: any): Promise<void> => {
    const payload = {
      id: stockProduct.id,
      amount: stockProduct.amount - 1
    }
    await api.put(`http://localhost:3333/stock/${stockProduct.id}`, payload);
  }

  const saveDataInStorage = async (payload: Array<any>) => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(payload));
      setCart(payload)
  }

  const addProduct = async (productId: number) => {
    try {
      const products: any = await api.get('http://localhost:3333/products');
      const findProduct = products.data.find((item: any) => item.id === productId);
      const stockProduct = await validateStock(productId);
      await updatedStock(stockProduct);

      if (!cart.length) {
        const cart = [{...findProduct, amount: 1}];
        saveDataInStorage(cart);
        return;
      }

      const findSameProduct = cart.find((product: any) => product.id === productId);

      let payload = [];
      if (findSameProduct) {
        const newCart = cart.map((product: any) => {
          if (product.id === productId) {
            product.amount = product.amount + 1;
          }
          return product;
        })
        payload = [...newCart];
      } else {
        payload = [...cart, {...findProduct, amount: 1}];
      }

      saveDataInStorage(payload);
    } catch (error) {
      console.log('error', error)
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      

      const filterProduct = cart.filter((product: any) => product.id !== productId);

      if (filterProduct.length > 0) {
          setCart(filterProduct);
      }
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
    type
  }: UpdateProductAmount) => {
    try {

      const findProduct = cart.find((product: any) => product.id === productId);
      console.log(type)

      if (type === 'increment') {
        
        if (findProduct && findProduct.amount > 1) {
          amount = amount + 1;
        }

      }

      if (type === 'decrement') {

        if (findProduct && findProduct.amount > 1) {
          amount = amount - 1;
        }

      }

      console.log('findProduct', findProduct);
      
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
