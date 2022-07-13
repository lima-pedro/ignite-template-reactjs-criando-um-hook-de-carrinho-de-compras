// import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
  // type: string;
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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      let payload = [];

      const { data: stockProduct } = await api.get(`/stock/${productId}`);

      if (stockProduct.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const cartProduct = cart.find((product: Product) => product.id === productId);

      if (cartProduct) {
        payload = cart.map((product: Product) => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            }
          }
          return product;
        }); 

      } else {
        const { data: product } = await api.get(`/products/${productId}`);

        payload = [
          ...cart,
          {...product, amount: 1}
        ]
      }

      setCart(payload);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(payload));

    } catch (error) {
      toast.error('Erro na adição do produto')
    }
 

  };  

  const removeProduct = (productId: number) => {
    try {
      const find = cart.filter(
        (product: any) => product.id === productId
      );
    
      if (!find.length) {
        toast.error("Erro na remoção do produto");
        return;
      }
      
      const filterProduct = cart.filter(
        (product: any) => product.id !== productId
      );

      setCart(filterProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filterProduct));

    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        throw new Error();
      }

      const { data: { amount: stockProduct } } = await api.get(`/stock/${productId}`);

      if (amount > stockProduct) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (stockProduct < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map((product: Product) => {
        if (product.id === productId) {
          product.amount = amount;
        }
        return product;
      })

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
