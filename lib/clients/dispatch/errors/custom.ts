export type CustomError =
  | InvalidAmounts
  | InvalidTokenAccount
  | InvalidMint
  | BuyBackAccountRequired
  | InvalidStateAccount
  | InvalidVaultAuthority

export class InvalidAmounts extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "InvalidAmounts"
  readonly msg = "Invalid amounts provided"

  constructor(readonly logs?: string[]) {
    super("6000: Invalid amounts provided")
  }
}

export class InvalidTokenAccount extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "InvalidTokenAccount"
  readonly msg = "Invalid token account"

  constructor(readonly logs?: string[]) {
    super("6001: Invalid token account")
  }
}

export class InvalidMint extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "InvalidMint"
  readonly msg = "Invalid mint"

  constructor(readonly logs?: string[]) {
    super("6002: Invalid mint")
  }
}

export class BuyBackAccountRequired extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "BuyBackAccountRequired"
  readonly msg = "Buy back account required when buy back amount is non-zero"

  constructor(readonly logs?: string[]) {
    super("6003: Buy back account required when buy back amount is non-zero")
  }
}

export class InvalidStateAccount extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "InvalidStateAccount"
  readonly msg = "Invalid state account"

  constructor(readonly logs?: string[]) {
    super("6004: Invalid state account")
  }
}

export class InvalidVaultAuthority extends Error {
  static readonly code = 6005
  readonly code = 6005
  readonly name = "InvalidVaultAuthority"
  readonly msg = "Invalid vault authority"

  constructor(readonly logs?: string[]) {
    super("6005: Invalid vault authority")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new InvalidAmounts(logs)
    case 6001:
      return new InvalidTokenAccount(logs)
    case 6002:
      return new InvalidMint(logs)
    case 6003:
      return new BuyBackAccountRequired(logs)
    case 6004:
      return new InvalidStateAccount(logs)
    case 6005:
      return new InvalidVaultAuthority(logs)
  }

  return null
}
