interface TokenType {
  contractAddress: string;
  decimals: number;
  symbol?: string;
  name?: string;
  chainId?: number
}

export class Token {
  constructor(public params: TokenType) {}

  public contractAddress = this.params.contractAddress;
  public decimals = this.params.decimals;
  public name = this.params.name
  public symbol = this.params.symbol
  public chainId = this.params.chainId
}
