const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const TICKER_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  TON: "the-open-network",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  MATIC: "matic-network",
  UNI: "uniswap",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BNB: "binancecoin",
  TRX: "tron",
  ATOM: "cosmos",
  NEAR: "near",
  APT: "aptos",
  SUI: "sui",
  ARB: "arbitrum",
  OP: "optimism",
};

export interface PriceData {
  ticker: string;
  name: string;
  priceUsd: number;
  change1h: number;
}

export async function fetchPrice(ticker: string): Promise<PriceData | null> {
  const id = TICKER_TO_ID[ticker.toUpperCase()];
  if (!id) return null;
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=false&include_last_updated_at=false`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, { usd?: number }>;
    const coin = data[id];
    if (!coin?.usd) return null;
    return {
      ticker: ticker.toUpperCase(),
      name: id.replace(/-/g, " "),
      priceUsd: coin.usd,
      change1h: 0,
    };
  } catch {
    return null;
  }
}

export async function fetchPrices(
  tickers: string[],
): Promise<PriceData[]> {
  const ids = tickers
    .map((t) => TICKER_TO_ID[t.toUpperCase()])
    .filter(Boolean);
  if (ids.length === 0) return [];
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=false`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, { usd?: number }>;
    return tickers
      .map((t) => {
        const id = TICKER_TO_ID[t.toUpperCase()];
        if (!id) return null;
        const coin = data[id];
        if (!coin?.usd) return null;
        return {
          ticker: t.toUpperCase(),
          name: id.replace(/-/g, " "),
          priceUsd: coin.usd,
          change1h: 0,
        };
      })
      .filter((p): p is PriceData => p !== null);
  } catch {
    return [];
  }
}

export function lookupTickerId(ticker: string): string | null {
  return TICKER_TO_ID[ticker.toUpperCase()] ?? null;
}

export function supportedTickers(): string[] {
  return Object.keys(TICKER_TO_ID);
}
