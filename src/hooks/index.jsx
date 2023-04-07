import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { ChainId, Token, TokenAmount } from '@voltage-finance/sdk'
import BigNumberJS from 'bignumber.js'

import { BigNumber, ethers } from 'ethers'
import { useEffect, useState } from 'react'
export const STABLESWAP_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/t0mcr8se/stableswap-subgraph' // TODO: deploy under voltfinance
export const FUSESWAP_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/fuseio/fuseswap'

export const FUSE_UST = new Token(
  ChainId.FUSE,
  '0x0D58a44be3dCA0aB449965dcc2c46932547Fea2f',
  18,
  'atUST',
  'UST Terra on Fuse'
)
export const FUSE_USDT = new Token(
  ChainId.FUSE,
  '0xFaDbBF8Ce7D5b7041bE672561bbA99f79c532e10',
  6,
  'USDT',
  'Tether USD on Fuse'
)
export const FUSE_USDC = new Token(
  ChainId.FUSE,
  '0x620fd5fa44BE6af63715Ef4E65DDFA0387aD13F5',
  6,
  'USDC',
  'USD Coin on Fuse'
)
export const FUSE_FUSD = new Token(
  ChainId.FUSE,
  '0x249BE57637D8B013Ad64785404b24aeBaE9B098B',
  18,
  'fUSD',
  'Fuse Dollar'
)
export const FUSE_BUSD = new Token(
  ChainId.FUSE,
  '0x6a5F6A8121592BeCd6747a38d67451B310F7f156',
  18,
  'BUSD',
  'Binance USD on Fuse'
)

export const fuseswapSubgraphClient = new ApolloClient({
  uri: FUSESWAP_SUBGRAPH_URL,
  cache: new InMemoryCache(),
})
const bundleFields = gql`
  fragment bundleFields on Bundle {
    id
    ethPrice
  }
`

const fusePriceQuery = gql`
  query ethPriceQuery($id: Int! = 1, $block: Block_height) {
    bundles(id: $id, block: $block) {
      ...bundleFields
    }
  }
  ${bundleFields}
`

export const getBundle = async (query = fusePriceQuery, variables = { id: 1 }) => {
  const result = await fuseswapSubgraphClient.query({
    query,
    variables,
  })

  return result.data?.bundles ? result.data?.bundles[0]?.ethPrice : null
}

export const VOLTAGE_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/voltfinance/voltage-exchange'

export const getNativePrice = async (variables) => {
  const result = await getBundle(undefined, variables)
  return result
}
export const voltageSubgraphClient = new ApolloClient({
  uri: VOLTAGE_SUBGRAPH_URL,
  cache: new InMemoryCache(),
})

export const getTokenPrice = async (query, variables) => {
  const nativePrice = await getNativePrice()
  const result = await voltageSubgraphClient.query({
    query,
    variables,
  })

  return nativePrice && result.data?.token ? result.data?.token?.derivedETH * nativePrice : 0
}
export const tokenPriceQuery = gql`
  query tokenPriceQuery($id: String!) {
    token(id: $id) {
      id
      derivedETH
    }
  }
`

export async function getStablecoinPrices() {
  // Stablecoin prices for the stable pool
  const fusd = await getTokenPrice(tokenPriceQuery, {
    id: FUSE_FUSD.address.toLowerCase(),
  })
  const usdt = await getTokenPrice(tokenPriceQuery, {
    id: FUSE_USDT.address.toLowerCase(),
  })

  const usdc = await getTokenPrice(tokenPriceQuery, {
    id: FUSE_USDC.address.toLowerCase(),
  })
  const busd = await getTokenPrice(tokenPriceQuery, {
    id: FUSE_BUSD.address.toLowerCase(),
  })
  const ust = await getTokenPrice(tokenPriceQuery, {
    id: FUSE_UST.address.toLowerCase(),
  })

  return {
    [FUSE_FUSD.address]: fusd,
    [FUSE_USDT.address]: usdt,
    [FUSE_USDC.address]: usdc,
    [FUSE_BUSD.address]: busd,
    [FUSE_UST.address]: ust,
  }
}

export async function getVoltPrice() {
  const voltPrice = await getTokenPrice(tokenPriceQuery, {
    id: '0x34Ef2Cc892a88415e9f02b91BfA9c91fC0bE6bD4'.toLowerCase(),
  })
  return voltPrice
}

export const tryFormatDecimalAmount = (amount, tokenDecimals = 18, decimals = 0) => {
  if (!amount || !tokenDecimals) return undefined

  try {
    return new BigNumberJS(amount)
      .div(10 ** tokenDecimals)
      .toNumber()
      .toFixed(decimals)
  } catch (error) {
    console.debug(`Failed to format decimal amount: "${amount}"`, error)
  }

  return undefined
}

export const stableswapSubgraphClient = new ApolloClient({
  uri: STABLESWAP_SUBGRAPH_URL,
  cache: new InMemoryCache(),
})

const stableswapTokenBalancesQuery = gql`
  {
    swaps {
      id
      balances
      tokens {
        id
      }
    }
  }
`
export const getStableswapTokenBalances = async (query = stableswapTokenBalancesQuery) => {
  const result = await stableswapSubgraphClient.query({
    query: stableswapTokenBalancesQuery,
  })

  return result.data?.swaps
}
export const VUSD1 = new Token(
  ChainId.FUSE,
  '0xa3c1046290B490e629E11AcE35863CB0CAe382aB',
  18,
  'vUSD1',
  'vUSD1 LP Token'
)

export const VUSD2 = new Token(
  ChainId.FUSE,
  '0xC71CAb88c1674A39A3e2841274E54e34D709Af91',
  18,
  'vUSD2',
  'vUSD2 LP Token'
)
export const STABLESWAP_POOLS = {
  '0x2a68D7C6Ea986fA06B2665d08b4D08F5e7aF960c': {
    name: 'vUSD1',
    address: '0x2a68D7C6Ea986fA06B2665d08b4D08F5e7aF960c',
    lpToken: VUSD1,
    tokenList: [FUSE_BUSD, FUSE_USDC, FUSE_USDT],
  },
  '0x83D158Beadbb3445AC901cFd0ca33FB30CCC8f53': {
    name: 'vUSD2',
    address: '0x83D158Beadbb3445AC901cFd0ca33FB30CCC8f53',
    lpToken: VUSD2,
    tokenList: [FUSE_FUSD, FUSE_USDT, FUSE_UST],
  },
}

const GET_TOTAL_LOCKED = gql`
  {
    uniswapFactories(first: 1) {
      totalLiquidityUSD
    }
  }
`

const GET_TOTAL_LOCKED_V2 = gql`
  {
    factories(first: 1) {
      liquidityUSD
    }
  }
`

const GET_FUSD_TOTAL_LOCKED = gql`
  {
    massets(first:1){
      totalSupply {
        simple
      }
    }
  }
`

const GET_XVOLT_TOTAL_LOCKED = gql`
  {
    bars(first:1){
      totalSupply
      ratio
    }
  }
`

const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/voltfinance/voltage-exchange',
  cache: new InMemoryCache(),
})

const clientV2 = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/voltfinance/voltage-exchange-v2',
  cache: new InMemoryCache(),
})

const fusdClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/voltfinance/fusd-subgraph',
  cache: new InMemoryCache(),
})

const voltBarClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/t0mcr8se/voltbar',
  cache: new InMemoryCache(),
})

export function useTVL() {
  let [tvl, setTvl] = useState(0)
  let [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      const usdPrices = await getStablecoinPrices()
      const voltPrice = await getVoltPrice()

      const { data: staleSwapData } = await stableswapSubgraphClient.query({
        query: stableswapTokenBalancesQuery,
      })
      const { data: dexData } = await clientV2.query({ 
        query: GET_TOTAL_LOCKED_V2
      })
      const { data: fusdData } = await fusdClient.query({
        query: GET_FUSD_TOTAL_LOCKED
      })
      const { data: voltBarData } = await voltBarClient.query({
        query: GET_XVOLT_TOTAL_LOCKED
      })

      const dexLiquidity = dexData?.factories[0]?.liquidityUSD
      const stableSwapLiquidity = staleSwapData?.swaps.reduce((mem, swap) => {
        const poolAddress = ethers.utils.getAddress(swap.id)
        return mem.add(
          swap.balances.reduce((mem, rawBalance, i) => {
            const token = STABLESWAP_POOLS[poolAddress].tokenList[i]
            return mem.add(
              new TokenAmount(token, rawBalance).multiply(((usdPrices[token.address] ?? 1) * 1e18).toString()).toFixed(0)
            )
          }, BigNumber.from('0'))
        )
      }, BigNumber.from('0'))
      const fusdLiquidity = fusdData?.massets[0]?.totalSupply?.simple * usdPrices[FUSE_FUSD.address]
      const xvoltLocked = voltBarData?.bars[0]?.totalSupply * voltBarData?.bars[0]?.ratio * voltPrice
      
      setTvl(parseFloat(dexLiquidity) + parseFloat(tryFormatDecimalAmount(stableSwapLiquidity.toString(), 18)) + fusdLiquidity + xvoltLocked)
      setLoading(false)
    }

    getData()
  }, [])
  return {tvl, loading}
}
