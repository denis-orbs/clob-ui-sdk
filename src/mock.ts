export const mockSwap = {
  fromToken: {
    decimals: 18,
    symbol: "WOMBAT",
    name: "Wombat",
    chainId: 137,
    address: "0x0C9c7712C83B3C70e7c5E11100D33D9401BdF9dd",
    tokenInfo: {
      name: "Wombat",
      address: "0x0C9c7712C83B3C70e7c5E11100D33D9401BdF9dd",
      symbol: "WOMBAT",
      decimals: 18,
      chainId: 137,
      logoURI:
        "https://assets.coingecko.com/coins/images/26430/small/Project_Page_Icon.png?1657930951",
    },
    tags: [],
    isNative: false,
    isToken: true,
  },
  toToken: {
    decimals: 18,
    symbol: "END",
    name: "Endblock",
    chainId: 137,
    address: "0x0C087f8D6A1F14F71bB7Cc7E1B061CA297AF7555",
    tokenInfo: {
      name: "Endblock",
      address: "0x0C087f8D6A1F14F71bB7Cc7E1B061CA297AF7555",
      symbol: "END",
      decimals: 18,
      chainId: 137,
      logoURI: "https://endblock.io/logos/logo-endblock-200x200.png",
    },
    tags: [],
    isNative: false,
    isToken: true,
  },
  fromTokenUsd: "96.327751640123353621",
  toTokenUsd: "296.35",
  fromAmount: "72.245",
  dexAmountOut: "0.244",
};

export const mockQuoteResponse = {
  inToken: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  outToken: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  inAmount: "72245813730092515215",
  outAmount: "243143029711521076",
  user: "0x50015A452E644F5511fbeeac6B2aD2bf154E40E4",
  slippage: 0.5,
  qs: "",
  partner: "thena",
  exchange: "paraswap",
  sessionId: "93a5708a_56",
  serializedOrder:
    "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000658be81e00000000000000000000000000000000000000000000000000000000658be83c0000000000000000000000006e24969c7425475f9f3aa065dc10d74d188107dd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000000000000000000000000003ea9cb0d01333ff8f000000000000000000000000000000000000000000000003ea9cb0d01333ff8f0000000000000000000000000000000000000000000000000000000000000200000000000000000000000000e9e78109c89162cef32bfe7cbcee1f31312fc1f600000000000000000000000050015a452e644f5511fbeeac6b2ad2bf154e40e400000000000000000000000000000000000000000000000000000000658be81400000000000000000000000000000000000000000000000000000000658be8500000000000000000000000006e24969c7425475f9f3aa065dc10d74d188107dd00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c0000000000000000000000000000000000000000000000000000000000079e640000000000000000000000000000000000000000000000000000000000079e64000000000000000000000000b1baf397b3946a81c7f5c54807474ecf194dc446000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c00000000000000000000000000000000000000000000000003687fc85ebd3898000000000000000000000000000000000000000000000000035fd14c1b914ef400000000000000000000000050015a452e644f5511fbeeac6b2ad2bf154e40e4",
  permitData: {
    domain: {
      name: "Permit2",
      chainId: "56",
      verifyingContract: "0x000000000022d473030f116ddee9f6b43ac78ba3",
    },
    types: {
      PermitWitnessTransferFrom: [
        {
          name: "permitted",
          type: "TokenPermissions",
        },
        {
          name: "spender",
          type: "address",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
        },
        {
          name: "witness",
          type: "ExclusiveDutchOrder",
        },
      ],
      TokenPermissions: [
        {
          name: "token",
          type: "address",
        },
        {
          name: "amount",
          type: "uint256",
        },
      ],
      ExclusiveDutchOrder: [
        {
          name: "info",
          type: "OrderInfo",
        },
        {
          name: "decayStartTime",
          type: "uint256",
        },
        {
          name: "decayEndTime",
          type: "uint256",
        },
        {
          name: "exclusiveFiller",
          type: "address",
        },
        {
          name: "exclusivityOverrideBps",
          type: "uint256",
        },
        {
          name: "inputToken",
          type: "address",
        },
        {
          name: "inputStartAmount",
          type: "uint256",
        },
        {
          name: "inputEndAmount",
          type: "uint256",
        },
        {
          name: "outputs",
          type: "DutchOutput[]",
        },
      ],
      OrderInfo: [
        {
          name: "reactor",
          type: "address",
        },
        {
          name: "swapper",
          type: "address",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
        },
        {
          name: "additionalValidationContract",
          type: "address",
        },
        {
          name: "additionalValidationData",
          type: "bytes",
        },
      ],
      DutchOutput: [
        {
          name: "token",
          type: "address",
        },
        {
          name: "startAmount",
          type: "uint256",
        },
        {
          name: "endAmount",
          type: "uint256",
        },
        {
          name: "recipient",
          type: "address",
        },
      ],
    },
    values: {
      permitted: {
        token: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        amount: {
          type: "BigNumber",
          hex: "0x03ea9cb0d01333ff8f",
        },
      },
      spender: "0xe9E78109c89162cEF32Bfe7cBCEe1f31312fc1F6",
      nonce: {
        type: "BigNumber",
        hex: "0x658be814",
      },
      deadline: 1703667792,
      witness: {
        info: {
          reactor: "0xe9E78109c89162cEF32Bfe7cBCEe1f31312fc1F6",
          swapper: "0x50015A452E644F5511fbeeac6B2aD2bf154E40E4",
          nonce: {
            type: "BigNumber",
            hex: "0x658be814",
          },
          deadline: 1703667792,
          additionalValidationContract:
            "0x6E24969C7425475f9f3aA065Dc10D74d188107DD",
          additionalValidationData: "0x",
        },
        decayStartTime: 1703667742,
        decayEndTime: 1703667772,
        exclusiveFiller: "0x6E24969C7425475f9f3aA065Dc10D74d188107DD",
        exclusivityOverrideBps: {
          type: "BigNumber",
          hex: "0x00",
        },
        inputToken: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        inputStartAmount: {
          type: "BigNumber",
          hex: "0x03ea9cb0d01333ff8f",
        },
        inputEndAmount: {
          type: "BigNumber",
          hex: "0x03ea9cb0d01333ff8f",
        },
        outputs: [
          {
            token: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            startAmount: {
              type: "BigNumber",
              hex: "0x079e64",
            },
            endAmount: {
              type: "BigNumber",
              hex: "0x079e64",
            },
            recipient: "0xb1BaF397B3946a81c7f5C54807474ECF194dc446",
          },
          {
            token: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            startAmount: {
              type: "BigNumber",
              hex: "0x03687fc85ebd3898",
            },
            endAmount: {
              type: "BigNumber",
              hex: "0x035fd14c1b914ef4",
            },
            recipient: "0x50015A452E644F5511fbeeac6B2aD2bf154E40E4",
          },
        ],
      },
    },
  },
};
