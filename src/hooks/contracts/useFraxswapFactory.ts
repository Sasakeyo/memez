import { Address } from 'viem';
import { IFraxswapFactory$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapFactory.sol/IFraxswapFactory';
import IFraxswapFactoryJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapFactory.sol/IFraxswapFactory.json';
import { useMemo } from 'react';

const factoryAddress = '0x6725F303b657a9451d8BA641348b6761A6CC7a17' as Address;

export const useFraxswapFactoryConfig = () => {
  return useMemo(
    () =>
      ({
        address: factoryAddress,
        abi: IFraxswapFactoryJSON.abi as IFraxswapFactory$Type['abi'],
      }) as const,
    [],
  );
};
