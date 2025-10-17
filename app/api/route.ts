import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validatorId = searchParams.get('validatorId');
  const rpcUrls = [
    process.env.RPC_URL || 'https://rpc.pulsechain.com',
    'https://rpc-pulsechain.g4mm4.io',
  ];

  if (!validatorId) {
    return NextResponse.json({ error: 'validatorId is required' }, { status: 400 });
  }

  let response;
  try {
    for (const url of rpcUrls) {
      response = await fetch(`${url}/eth/v1/beacon/states/head/validators/${validatorId}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
      if (response.ok) break;
      console.error(`Failed RPC ${url}: ${response.statusText}`);
    }

    if (!response?.ok) {
      throw new Error('Failed to fetch validator data from all RPCs');
    }

    const data = await response.json();
    if (!data.data) throw new Error('Invalid validator data');

    const validatorData = {
      index: data.data.index,
      balance: Number(data.data.balance) / 10**9, // Convert gwei to PLS
      status: data.data.status,
      effectiveBalance: Number(data.data.effective_balance) / 10**9, // In PLS
    };

    return NextResponse.json(validatorData);
  } catch (error) {
    console.error('Validator fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
