import { Chain } from "@rainbow-me/rainbowkit";

export const sagaMixtixChain = {
    id: 2747408668452000,
    name: 'AxioMark',
    nativeCurrency: {
        decimals: 18,
        name: 'mintix',
        symbol: 'MIX',
    },
    rpcUrls: {
        public: { http: ['https://mixtix-2747408668452000-1.jsonrpc.sagarpc.io'] },
        default: { http: ['https://mixtix-2747408668452000-1.jsonrpc.sagarpc.io'] },
    },
    blockExplorers: {
        default: {
            name: 'Saga Explorer',
            url: 'https://mixtix-2747408668452000-1.sagaexplorer.io'
        },
    },
    iconUrl: './logo/logo.png',
} as const satisfies Chain;

export const lisk = {
    id: 1135,
    name: 'Lisk',
    nativeCurrency: {
        decimals: 18,
        name: 'Lisk',
        symbol: 'LSK',
    },
    rpcUrls: {
        public: { http: ['https://rpc.lisk.com'] },
        default: { http: ['https://rpc.lisk.com'] },
    },
    blockExplorers: {
        default: {
            name: 'Lisk Explorer',
            url: 'https://blockscout.lisk.com/'
        },
    },
    iconUrl: 'https://s3-alpha.figma.com/hub/file/2178439403/ccf7984e-fce7-42ff-ad57-4b5577f2899d-cover.png',
} as const satisfies Chain;
