import React, { useState, useMemo, useEffect } from 'react';
import PageHead from '../components/PageHead';
import TextInput from '../components/TextInput';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { useChartOptions, useMemezFactoryConfig } from '../hooks';
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { formatEther, parseEther, parseEventLogs } from 'viem';
import { useRouter } from 'next/router';
import { getPrice, getSupply, isValidHttpUrl } from '../utils';
import ApexChart from '../components/ApexChart';

const chartIntervalsCount = 50;

enum CreationStep {
  TokenInfo,
  Tokenomics,
  Finish,
}

export function Create() {
  const router = useRouter();
  const [step, setStep] = useState(CreationStep.TokenInfo);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [cap, setCap] = useState<string | number>('10');
  const [initialBuyout, setInitialBuyout] = useState<string | number>('');
  const [curveFactorN, setCurveFactorN] = useState<string | number>('1000');
  const [curveFactorD, setCurveFactorD] = useState<string | number>('');
  const [curvePowerN, setCurvePowerN] = useState<string | number>('3');
  const [curvePowerD, setCurvePowerD] = useState<string | number>('');

  const memezFactoryConfig = useMemezFactoryConfig();

  const nameError = useMemo(
    () =>
      name.length < 1
        ? 'Name is too short!'
        : name.length > 30
          ? 'Name is too long!'
          : null,
    [name],
  );
  const symbolError = useMemo(
    () =>
      symbol.length < 1
        ? 'Symbol is too short!'
        : symbol.length > 20
          ? 'Symbol is too long!'
          : null,
    [symbol],
  );
  const descriptionError = useMemo(
    () => (description.length > 200 ? 'Description is too long!' : null),
    [description],
  );
  const websiteUrlError = useMemo(
    () =>
      !websiteUrl
        ? null
        : websiteUrl.length > 50
          ? 'Website URL is too long!'
          : !isValidHttpUrl(websiteUrl)
            ? 'Website URL is invalid!'
            : null,
    [websiteUrl],
  );
  const telegramUrlError = useMemo(
    () =>
      !telegramUrl
        ? null
        : telegramUrl.length > 50
          ? 'Telegram URL is too long!'
          : !isValidHttpUrl(telegramUrl, ['t.me'], true)
            ? 'Telegram URL is invalid!'
            : null,
    [telegramUrl],
  );
  const twitterUrlError = useMemo(
    () =>
      !twitterUrl
        ? null
        : twitterUrl.length > 50
          ? 'Twitter (X) URL is too long!'
          : !isValidHttpUrl(twitterUrl, ['twitter.com', 'x.com'])
            ? 'Twitter (X) URL is invalid!'
            : null,
    [twitterUrl],
  );

  const capError = useMemo(
    () => (!cap || Number(cap) < 1 ? 'Invalid cap!' : null),
    [cap],
  );
  const curveFactorNError = useMemo(
    () =>
      !curveFactorN || Number(curveFactorN) < 0
        ? 'Invalid curve factor numerator!'
        : null,
    [curveFactorN],
  );
  const curveFactorDError = useMemo(
    () =>
      !!curveFactorD && Number(curveFactorD) <= 0
        ? 'Invalid curve factor denominator!'
        : null,
    [curveFactorD],
  );
  const curvePowerNError = useMemo(
    () =>
      !curvePowerN || Number(curvePowerN) < 0
        ? 'Invalid curve power numerator!'
        : null,
    [curvePowerN],
  );
  const curvePowerDError = useMemo(
    () =>
      !!curvePowerD && Number(curvePowerD) <= 0
        ? 'Invalid curve power denominator!'
        : null,
    [curvePowerD],
  );
  const initialBuyoutError = useMemo(
    () =>
      !initialBuyout
        ? null
        : Number(initialBuyout) > Number(cap)
          ? 'Initial buyout must not exceed the cap!'
          : null,
    [cap, initialBuyout],
  );

  const tokenInfoError = useMemo(
    () =>
      nameError ||
      symbolError ||
      descriptionError ||
      websiteUrlError ||
      telegramUrlError ||
      twitterUrlError,
    [
      nameError,
      symbolError,
      descriptionError,
      websiteUrlError,
      telegramUrlError,
      twitterUrlError,
    ],
  );

  const tokenomicsError = useMemo(
    () =>
      capError ||
      curveFactorNError ||
      curveFactorDError ||
      curvePowerNError ||
      curvePowerDError ||
      initialBuyoutError,
    [
      capError,
      curveFactorNError,
      curveFactorDError,
      curvePowerNError,
      curvePowerDError,
      initialBuyoutError,
    ],
  );

  const isValidationError = useMemo(
    () => !!tokenInfoError || !!tokenomicsError,
    [tokenInfoError, tokenomicsError],
  );

  const maxSupply = useMemo(
    () =>
      !tokenomicsError
        ? getSupply(
            parseEther((cap || 0).toString()),
            BigInt(curvePowerN || 0),
            BigInt(curvePowerD || 1),
            BigInt(curveFactorN || 0),
            BigInt(curveFactorD || 1),
          )
        : 0n,
    [
      tokenomicsError,
      cap,
      curveFactorD,
      curveFactorN,
      curvePowerD,
      curvePowerN,
    ],
  );

  const buyoutSupply = useMemo(
    () =>
      !tokenomicsError && Number(initialBuyout) > 0
        ? getSupply(
            parseEther((initialBuyout || 0).toString()),
            BigInt(curvePowerN || 0),
            BigInt(curvePowerD || 1),
            BigInt(curveFactorN || 0),
            BigInt(curveFactorD || 1),
          )
        : 0n,
    [
      tokenomicsError,
      initialBuyout,
      curveFactorD,
      curveFactorN,
      curvePowerD,
      curvePowerN,
    ],
  );

  const chartData = useMemo(() => {
    if (!maxSupply || tokenomicsError) return undefined;
    const supplyStep = maxSupply / BigInt(chartIntervalsCount);

    return [...new Array(chartIntervalsCount + 1)]
      .map((_, i) => BigInt(i) * supplyStep)
      .map(
        (supply) =>
          [
            Number(formatEther(supply)),
            Number(
              formatEther(
                getPrice(
                  supply,
                  BigInt(curvePowerN || 0),
                  BigInt(curvePowerD || 1),
                  BigInt(curveFactorN || 0),
                  BigInt(curveFactorD || 1),
                ),
              ),
            ),
          ] as [number, number],
      );
  }, [
    curveFactorD,
    curveFactorN,
    curvePowerD,
    curvePowerN,
    maxSupply,
    tokenomicsError,
  ]);

  const buyoutPoint = useMemo(
    () =>
      !tokenomicsError && buyoutSupply > 0n
        ? {
            x: Number(formatEther(buyoutSupply)),
            y: Number(
              formatEther(
                getPrice(
                  buyoutSupply,
                  BigInt(curvePowerN),
                  BigInt(curvePowerD || 1),
                  BigInt(curveFactorN),
                  BigInt(curveFactorD || 1),
                ),
              ),
            ),
            text:
              Number(((Number(initialBuyout) / Number(cap)) * 100).toFixed(2)) +
              '%',
          }
        : undefined,
    [
      tokenomicsError,
      buyoutSupply,
      initialBuyout,
      cap,
      curvePowerN,
      curvePowerD,
      curveFactorN,
      curveFactorD,
    ],
  );

  const chartOptions = useChartOptions({
    chartTitle: 'Bonding curve',
    titleX: 'Supply',
    titleY: 'Price',
    point: buyoutPoint,
  });

  const links = useMemo(
    () => [websiteUrl, telegramUrl, twitterUrl].filter((link) => link),
    [websiteUrl, telegramUrl, twitterUrl],
  );

  const { data, error } = useSimulateContract({
    ...memezFactoryConfig,
    functionName: 'deploy',
    args: [
      parseEther((cap || 0).toString()),
      Number(curvePowerN || 0),
      Number(curvePowerD || 1),
      Number(curveFactorN || 0),
      Number(curveFactorD || 1),
      name,
      symbol,
      description + (links.length > 0 ? `\nLinks:\n${links.join('\n')}` : ''),
      image,
    ],
    value: parseEther((initialBuyout || 0).toString()),
    query: {
      enabled: !isValidationError,
    },
  });

  const { data: hash, writeContract, isPending } = useWriteContract();

  const {
    data: result,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  const transactionMemeCoinDeployedEvent = useMemo(
    () =>
      result
        ? parseEventLogs({
            abi: memezFactoryConfig.abi,
            logs: result.logs,
            eventName: 'MemeCoinDeployed',
          })[0]
        : null,
    [memezFactoryConfig, result],
  );

  const deployedMemeCoinAddress = useMemo(
    () => transactionMemeCoinDeployedEvent?.args?.memecoin ?? null,
    [transactionMemeCoinDeployedEvent],
  );

  const simulationError = useMemo(
    () => (error ? (error.cause as any)?.reason ?? error.message : null),
    [error],
  );

  const isAnyError = useMemo(
    () => isValidationError || !!simulationError,
    [isValidationError, simulationError],
  );

  useEffect(() => {
    if (!deployedMemeCoinAddress) return;
    router.push(`/?coin=${deployedMemeCoinAddress}`);
  }, [deployedMemeCoinAddress, router]);

  return (
    <>
      <PageHead
        title="memez"
        subtitle="Create memecoin"
        description="Create your memecoin!"
      />
      <div className="flex flex-col gap-x3 items-center h-full">
        <div className="flex flex-row portrait:flex-col gap-x2 flex-1 w-full items-center justify-center landscape:overflow-hidden">
          <div className="flex flex-col gap-x2 landscape:flex-1 landscape:px-x2 portrait:w-full max-w-[600px] landscape:max-h-full landscape:overflow-auto">
            <div
              className={`flex flex-col gap-x2 landscape:flex-1 portrait:w-full w-full p-x2 rounded-x1
                backdrop-blur bg-gradient-to-b from-main-accent/16 border-2 cursor-pointer hover:border-main-accent
                ${step === CreationStep.TokenInfo ? 'border-main-accent' : step === CreationStep.Finish && !!tokenInfoError ? 'border-second-error' : 'border-main-shadow'}
                text-body font-medium tracking-body
              `}
              onClick={() => setStep(CreationStep.TokenInfo)}
            >
              <h2 className="font-bold text-headline-2 leading-normal text-center text-shadow">
                Token info
              </h2>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Name
                </span>
                {step === CreationStep.TokenInfo || !name ? (
                  <span className="font-medium">The name of your token</span>
                ) : (
                  <span className="font-bold">{name}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Symbol
                </span>
                {step === CreationStep.TokenInfo || !symbol ? (
                  <span className="font-medium">The symbol of your token</span>
                ) : (
                  <span className="font-bold">{symbol}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Description
                </span>
                {step === CreationStep.TokenInfo || !description ? (
                  <span className="font-medium">
                    The description of your token
                  </span>
                ) : (
                  <span className="font-bold">{description}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Website
                </span>
                {step === CreationStep.TokenInfo ? (
                  <span className="font-medium">
                    The website URL for your token
                  </span>
                ) : (
                  <span className="font-bold">
                    {websiteUrl || <i>No website provided</i>}
                  </span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Telegram
                </span>
                {step === CreationStep.TokenInfo ? (
                  <span className="font-medium">
                    The Telegram URL for your token
                  </span>
                ) : (
                  <span className="font-bold">
                    {telegramUrl || <i>No Telegram provided</i>}
                  </span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Twitter (X)
                </span>
                {step === CreationStep.TokenInfo ? (
                  <span className="font-medium">
                    The Twitter (X) URL for your token
                  </span>
                ) : (
                  <span className="font-bold">
                    {twitterUrl || <i>No Twitter (X) provided</i>}
                  </span>
                )}
              </div>
            </div>
            <div
              className={`flex flex-col gap-x2 landscape:flex-1 portrait:w-full w-full p-x2 rounded-x1
                backdrop-blur bg-gradient-to-b from-main-accent/16 border-2 cursor-pointer hover:border-main-accent
                ${step === CreationStep.Tokenomics ? 'border-main-accent' : step === CreationStep.Finish && !!tokenomicsError ? 'border-second-error' : 'border-main-shadow'}
                text-body font-medium tracking-body
              `}
              onClick={() => setStep(CreationStep.Tokenomics)}
            >
              <h2 className="font-bold text-headline-2 leading-normal text-center text-shadow">
                Tokenomics
              </h2>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Cap
                </span>
                {step === CreationStep.Tokenomics || !cap ? (
                  <span className="font-medium">
                    The cap of your token, ETH
                  </span>
                ) : (
                  <span className="font-bold">{cap} ETH</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Buyout
                </span>
                {step === CreationStep.Tokenomics ? (
                  <span className="font-medium">
                    The initial buyout of your token, ETH
                  </span>
                ) : (
                  <span className="font-bold">{initialBuyout || 0} ETH</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Factor
                </span>
                {step === CreationStep.Tokenomics || !curveFactorN ? (
                  <span className="font-medium">
                    The factor of the bonding curve, given as a numerator and a
                    denominator
                  </span>
                ) : curveFactorD && Number(curveFactorD) !== 1 ? (
                  <div className="flex flex-col items-center font-bold">
                    <div>{curveFactorN}</div>
                    <hr className="w-full border border-main-accent" />
                    <div>{curveFactorD}</div>
                  </div>
                ) : (
                  <span className="font-bold">{curveFactorN}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Power
                </span>
                {step === CreationStep.Tokenomics || !curvePowerN ? (
                  <span className="font-medium">
                    The power of the bonding curve, given as a numerator and a
                    denominator
                  </span>
                ) : curvePowerD && Number(curvePowerD) !== 1 ? (
                  <div className="flex flex-col items-center font-bold">
                    <div>{curvePowerN}</div>
                    <hr className="w-full border border-main-accent" />
                    <div>{curvePowerD}</div>
                  </div>
                ) : (
                  <span className="font-bold">{curvePowerN}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Price formula
                </span>
                {step === CreationStep.Tokenomics || !!tokenomicsError ? (
                  <div className="flex flex-row gap-x1 shrink-0 items-center font-medium">
                    <div className="flex flex-col items-center">
                      <div>F_N</div>
                      <hr className="w-full border border-main-accent" />
                      <div>F_D</div>
                    </div>
                    <div>*</div>
                    <div>supply ^</div>
                    <div className="flex flex-col items-center">
                      <div>P_N</div>
                      <hr className="w-full border border-main-accent" />
                      <div>P_D</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row gap-x1 shrink-0 items-center font-bold">
                    {curveFactorD ? (
                      <div className="flex flex-col items-center">
                        <div>{curveFactorN}</div>
                        <hr className="w-full border border-main-accent" />
                        <div>{curveFactorD}</div>
                      </div>
                    ) : (
                      <div>{curveFactorN}</div>
                    )}
                    <div>*</div>
                    <div>supply ^</div>
                    {curvePowerD ? (
                      <div className="flex flex-col items-center">
                        <div>{curvePowerN}</div>
                        <hr className="w-full border border-main-accent" />
                        <div>{curvePowerD}</div>
                      </div>
                    ) : (
                      <div>{curvePowerN}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Max supply
                </span>
                {!!tokenomicsError ? (
                  <span className="font-medium">
                    The max supply of your token
                  </span>
                ) : (
                  <span className="font-bold">
                    {formatEther(maxSupply)} {symbol || ''}
                  </span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title text-shadow leading-normal">
                  Buyout tokens
                </span>
                {!!tokenomicsError ? (
                  <span className="font-medium">
                    The buyout amount of tokens
                  </span>
                ) : (
                  <span className="font-bold">
                    {formatEther(buyoutSupply || 0n)} {symbol || ''}
                  </span>
                )}
              </div>
              <div className="flex flex-col w-full h-[512px] justify-center items-stretch">
                {chartData ? (
                  <ApexChart
                    options={chartOptions}
                    series={[{ data: chartData }]}
                    type="area"
                    width="100%"
                    height="512"
                  />
                ) : (
                  <p className="text-center">
                    Not enough data to build bonding curve
                  </p>
                )}
              </div>
            </div>
            {isConfirmed && (
              <p className="text-second-success">Memecoin created!</p>
            )}
            {step === CreationStep.Finish && isAnyError && (
              <p className="text-second-error">
                {tokenInfoError
                  ? 'Token Info'
                  : tokenomicsError
                    ? 'Tokenomics'
                    : 'Execution'}{' '}
                Error: {tokenInfoError || tokenomicsError || simulationError}
              </p>
            )}
            <PrimaryButton
              className={
                step !== CreationStep.Finish ? 'absolute bottom-x4 z-10' : ''
              }
              disabled={
                isAnyError || !data?.request || isPending || isConfirming
              }
              onClick={() => writeContract(data!.request)}
            >
              {isPending || isConfirming
                ? 'Creating memecoin...'
                : Number(initialBuyout || 0) > 0
                  ? `Create memecoin [${initialBuyout.toString()} ETH buyout]`
                  : 'Create memecoin'}
            </PrimaryButton>
          </div>
          {step !== CreationStep.Finish && (
            <div className="flex flex-col gap-x2 landscape:flex-1 landscape:px-x2 portrait:w-full max-w-[600px] landscape:max-h-full landscape:overflow-auto">
              {step === CreationStep.TokenInfo && (
                <div className="flex flex-col gap-x2 w-full p-x2 rounded-x1 border border-main-shadow backdrop-blur bg-gradient-to-b from-main-accent/16">
                  <h2 className="font-bold text-headline-2 leading-normal text-center text-shadow">
                    Token info
                  </h2>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="name-input"
                    >
                      Name
                    </label>
                    <TextInput
                      id="name-input"
                      value={name}
                      placeholder="Name"
                      isSmall
                      isError={!!nameError}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="symbol-input"
                    >
                      Symbol
                    </label>
                    <TextInput
                      id="symbol-input"
                      value={symbol}
                      placeholder="Symbol"
                      isSmall
                      isError={!!symbolError}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="description-input"
                    >
                      Description
                    </label>
                    <TextInput
                      id="description-input"
                      value={description}
                      placeholder="Description"
                      isSmall
                      isError={!!descriptionError}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="website-input"
                    >
                      Website
                    </label>
                    <TextInput
                      id="website-input"
                      value={websiteUrl}
                      placeholder="https://..."
                      isSmall
                      isError={!!websiteUrlError}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="telegram-input"
                    >
                      Telegram
                    </label>
                    <TextInput
                      id="telegram-input"
                      value={telegramUrl}
                      placeholder="https://t.me/..."
                      isSmall
                      isError={!!telegramUrlError}
                      onChange={(e) => setTelegramUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="twitter-input"
                    >
                      Twitter (X)
                    </label>
                    <TextInput
                      id="twitter-input"
                      value={twitterUrl}
                      placeholder="https://twitter.com/..."
                      isSmall
                      isError={!!twitterUrlError}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                    />
                  </div>
                  {!!tokenInfoError && (
                    <p className="text-second-error">Error: {tokenInfoError}</p>
                  )}
                </div>
              )}
              {step === CreationStep.Tokenomics && (
                <div className="flex flex-col gap-x2 w-full p-x2 rounded-x1 border border-main-shadow backdrop-blur bg-gradient-to-b from-main-accent/16">
                  <h2 className="font-bold text-headline-2 leading-normal text-center text-shadow">
                    Tokenomics
                  </h2>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="cap-input"
                    >
                      Cap
                    </label>
                    <TextInput
                      id="cap-input"
                      className="flex-1"
                      value={cap}
                      placeholder="0.0 ETH"
                      type="number"
                      step={1}
                      max={1000}
                      isSmall
                      isError={!!capError}
                      onChange={(e) =>
                        setCap(
                          e.target.value.toString().replaceAll(/[^0-9.,]/g, ''),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-headline-2 text-shadow leading-normal pl-x0.5"
                      htmlFor="initial-buyout-input"
                    >
                      Buyout
                    </label>
                    <TextInput
                      id="initial-buyout-input"
                      className="flex-1"
                      value={initialBuyout}
                      placeholder="0.0 ETH"
                      type="number"
                      min={0}
                      step={0.01}
                      max={Number(cap || 0)}
                      isSmall
                      isError={!!initialBuyoutError}
                      onChange={(e) =>
                        setInitialBuyout(
                          e.target.value.toString().replaceAll(/[^0-9.,]/g, ''),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-row gap-x1 justify-stretch items-center">
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title text-shadow leading-normal pl-x0.5"
                        htmlFor="factor-n-input"
                      >
                        Factor Numerator
                      </label>
                      <TextInput
                        id="factor-n-input"
                        className="flex-1"
                        value={curveFactorN}
                        placeholder="Factor numerator"
                        type="number"
                        step={1}
                        min={0}
                        max={1000000000}
                        isSmall
                        isError={!!curveFactorNError}
                        onChange={(e) =>
                          setCurveFactorN(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                    <div className="font-bold text-title leading-normal self-end py-[10px]">
                      /
                    </div>
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title text-shadow leading-normal pl-x0.5"
                        htmlFor="factor-d-input"
                      >
                        Factor Denominator
                      </label>
                      <TextInput
                        id="factor-d-input"
                        className="flex-1"
                        value={curveFactorD}
                        placeholder="Factor denominator"
                        type="number"
                        step={1}
                        min={1}
                        max={1000000000}
                        isSmall
                        isError={!!curveFactorDError}
                        onChange={(e) =>
                          setCurveFactorD(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-row gap-x1 justify-stretch items-center">
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title text-shadow leading-normal pl-x0.5"
                        htmlFor="power-n-input"
                      >
                        Power Numerator
                      </label>
                      <TextInput
                        id="power-n-input"
                        className="flex-1"
                        value={curvePowerN}
                        placeholder="Power numerator"
                        type="number"
                        step={1}
                        min={0}
                        max={10}
                        isSmall
                        isError={!!curvePowerNError}
                        onChange={(e) =>
                          setCurvePowerN(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                    <div className="font-bold text-title leading-normal self-end py-[10px]">
                      /
                    </div>
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title text-shadow leading-normal pl-x0.5"
                        htmlFor="power-d-input"
                      >
                        Power Denominator
                      </label>
                      <TextInput
                        id="power-d-input"
                        className="flex-1"
                        value={curvePowerD}
                        placeholder="Power denominator"
                        type="number"
                        step={1}
                        min={1}
                        max={10}
                        isSmall
                        isError={!!curvePowerDError}
                        onChange={(e) =>
                          setCurvePowerD(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                  </div>
                  {!!tokenomicsError && (
                    <p className="text-second-error">
                      Error: {tokenomicsError}
                    </p>
                  )}
                </div>
              )}
              <SecondaryButton onClick={() => setStep((step) => step + 1)}>
                {step === CreationStep.Finish - 1 ? 'Finish' : 'Next'}
              </SecondaryButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Create;
