import { Address } from 'viem';
import { IFraxswapRouter$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapRouter.sol/IFraxswapRouter';
import IFraxswapRouterJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapRouter.sol/IFraxswapRouter.json';
import { useMemo } from 'react';

const routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' as Address;

export const useFraxswapRouterConfig = () => {
  return useMemo(
    () =>
      ({
        address: routerAddress,
        abi: IFraxswapRouterJSON.abi as IFraxswapRouter$Type['abi'],
      }) as const,
    [],
  );
};
