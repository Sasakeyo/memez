import { Address } from 'viem';
import { IFraxswapFactory$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapFactory.sol/IFraxswapFactory';
import IFraxswapFactoryJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapFactory.sol/IFraxswapFactory.json';
import { useMemo } from 'react';

const factoryAddress = '0xbA7D3bc45946C3F27C7b3e360a454c37Ecbd41DF' as Address;

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
