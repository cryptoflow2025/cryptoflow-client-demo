import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface DispatchUsdcArgs {
  amounts: types.DispatchAmountsFields
}

export interface DispatchUsdcAccounts {
  user: PublicKey
  userUsdcAccount: PublicKey
  merchantUsdcAccount: PublicKey
  taxReceiverTokenAccount: PublicKey
  rewardsUsdcAccount: PublicKey
  /** TODO: Recheck this constraint in mainnet */
  buyBackTokenAccount: PublicKey
  tokenProgram: PublicKey
  stakeRewardsState: PublicKey
  vaultAuthority: PublicKey
  userInfo: PublicKey
  systemProgram: PublicKey
  associatedTokenProgram: PublicKey
  programId: PublicKey
}

export const layout = borsh.struct([types.DispatchAmounts.layout("amounts")])

export function dispatchUsdc(
  args: DispatchUsdcArgs,
  accounts: DispatchUsdcAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.userUsdcAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.merchantUsdcAccount, isSigner: false, isWritable: true },
    {
      pubkey: accounts.taxReceiverTokenAccount,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.rewardsUsdcAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.buyBackTokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.stakeRewardsState, isSigner: false, isWritable: true },
    { pubkey: accounts.vaultAuthority, isSigner: false, isWritable: true },
    { pubkey: accounts.userInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.programId, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([205, 168, 132, 131, 201, 93, 179, 55])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amounts: types.DispatchAmounts.toEncodable(args.amounts),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
