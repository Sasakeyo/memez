import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
// import { fraxtal } from 'wagmi/chains';
// import { bscTestnet } from 'viem/chains'
import { ADDRESSES } from './constants';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'memez',
  description: 'memez memecoins app',
  url: 'https://memez.me',
  icons: ['https://memez.me/icon.svg'],
};

const mamoz = {
  id: 7077,
  name: 'Mamoz Token Factory',
  nativeCurrency: { name: 'MMOZ', symbol: 'MMOZ', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.mamoz.xyz',
      ],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://exp.mamoz.xyz' },
  },

  contracts: {
    multicall3: {
      address: ADDRESSES.MULTICALL3,
    },
  },
};

export const chains = [
  mamoz,
] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  // enableEmail: true,
});
