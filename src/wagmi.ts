import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { fraxtal } from 'wagmi/chains';
import { bscTestnet } from 'viem/chains'
import { ADDRESSES } from './constants';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'memez',
  description: 'memez memecoins app',
  url: 'https://memez.me',
  icons: ['https://memez.me/icon.svg'],
};

const fraxtalVirtual = {
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://bsc-testnet-rpc.publicnode.com',
        'https://data-seed-prebsc-2-s1.bnbchain.org:8545',
      ],
    },
  },

  contracts: {
    multicall3: {
      address: ADDRESSES.MULTICALL3,
    },
  },
} as any as typeof bscTestnet;

export const chains = [
  process.env.NEXT_PUBLIC_GIT_BRANCH === 'main' ? bscTestnet : fraxtalVirtual,
] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableEmail: true,
});
