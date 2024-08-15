import { Address } from 'viem';
import { IFraxswapRouter$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapRouter.sol/IFraxswapRouter';
import IFraxswapRouterJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapRouter.sol/IFraxswapRouter.json';
import { useMemo } from 'react';

const routerAddress = '0xA3D26EbAD72F86b91B43b3616DaC2a6BDDE9b2a3' as Address;

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
