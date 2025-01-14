import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface DispatchAmountsFields {
  merchant: BN
  buyBack: BN
  taxReceiver: BN
  rewards: BN
}

export interface DispatchAmountsJSON {
  merchant: string
  buyBack: string
  taxReceiver: string
  rewards: string
}

export class DispatchAmounts {
  readonly merchant: BN
  readonly buyBack: BN
  readonly taxReceiver: BN
  readonly rewards: BN

  constructor(fields: DispatchAmountsFields) {
    this.merchant = fields.merchant
    this.buyBack = fields.buyBack
    this.taxReceiver = fields.taxReceiver
    this.rewards = fields.rewards
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("merchant"),
        borsh.u64("buyBack"),
        borsh.u64("taxReceiver"),
        borsh.u64("rewards"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new DispatchAmounts({
      merchant: obj.merchant,
      buyBack: obj.buyBack,
      taxReceiver: obj.taxReceiver,
      rewards: obj.rewards,
    })
  }

  static toEncodable(fields: DispatchAmountsFields) {
    return {
      merchant: fields.merchant,
      buyBack: fields.buyBack,
      taxReceiver: fields.taxReceiver,
      rewards: fields.rewards,
    }
  }

  toJSON(): DispatchAmountsJSON {
    return {
      merchant: this.merchant.toString(),
      buyBack: this.buyBack.toString(),
      taxReceiver: this.taxReceiver.toString(),
      rewards: this.rewards.toString(),
    }
  }

  static fromJSON(obj: DispatchAmountsJSON): DispatchAmounts {
    return new DispatchAmounts({
      merchant: new BN(obj.merchant),
      buyBack: new BN(obj.buyBack),
      taxReceiver: new BN(obj.taxReceiver),
      rewards: new BN(obj.rewards),
    })
  }

  toEncodable() {
    return DispatchAmounts.toEncodable(this)
  }
}
