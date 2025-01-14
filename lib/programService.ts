import { PublicKey, Connection, Transaction, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import BN from "bn.js";

import { projectService } from "../lib/clients/api";

// whitelist programs
import { 
  dispatchUsdc as dispatchUsdcWhitelist, 
  DispatchUsdcAccounts as DispatchUsdcAccountsWhitelist, 
  DispatchUsdcArgs as DispatchUsdcArgsWhitelist 
} from "./clients/dispatch_inner/instructions/dispatchUsdc";

// non-whitelist programs
import { 
  dispatchUsdc as dispatchUsdcNonWhitelist, 
  DispatchUsdcAccounts as DispatchUsdcAccountsNonWhitelist, 
  DispatchUsdcArgs as DispatchUsdcArgsNonWhitelist 
} from "./clients/dispatch/instructions/dispatchUsdc";

const DISPATCH_PROGRAM_ID = new PublicKey("dERWdfrhnVQwUpZxZAjwQ3DVypX1D4pB4GvTqfK6QYb");
const DISPATCH_INNER_PROGRAM_ID = new PublicKey("D7GuEpcZcQuRYMKU5Npw4NNa1warcMeq7GXaq9SEHct2");

export class ProgramService {
    constructor(private readonly connection: Connection) {}

    async dispatchUsdcForWhitelistStakingProgram(
      user: PublicKey, 
      projectId: string, 
      amount: number,
      callbacks?: {
        onStart?: () => void;
        onUpdate?: (signature: string, message: string) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
      }
    ): Promise<{ success: boolean, signature?: string, error?: string }> {
      try {
        callbacks?.onStart?.();

        // get distribution info
        const distribution = await projectService.getDistributionInfo(projectId);

        // calculate amounts
        const taxAmount = amount * distribution.tax_percentage / 10000;
        const remainingAmount = amount - taxAmount;
        const returnAmount = remainingAmount * distribution.return_share / 10000;
        const buyBackAmount = 0; // buy back is not supported for devnet
        const rewardsAmount = remainingAmount - returnAmount - buyBackAmount;

        // get accounts
        const stakeRewardsProgram = new PublicKey(distribution.rewards_contract);
        const [stakeRewardsState, _stakeRewardsStateBump] = PublicKey.findProgramAddressSync(
          [Buffer.from("state")],
          stakeRewardsProgram
        );

        const programAccountInfo = await this.connection.getAccountInfo(stakeRewardsProgram);
        if (!programAccountInfo) {
          throw new Error(`Program ${stakeRewardsProgram.toBase58()} not found on chain`);
        } else {
        }

        const [vaultAuthority, _vaultAuthorityBump] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault")],
          stakeRewardsProgram
        );

        const userUsdcAccount = await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!),
          user,
          false
        );

        const merchantAddress = new PublicKey(distribution.return_address);
        const merchantUsdcAta = await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!),
          merchantAddress
        );

        const taxReceiverTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!), 
          new PublicKey(distribution.tax_receiver)
        );

        const rewardsUsdcAccount = distribution.rewards_contract ? await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!), 
          new PublicKey(vaultAuthority),
          true
        ) : null;

        const dispatchArgsWhitelist: DispatchUsdcArgsWhitelist = {
          amounts: {
            merchant: new BN(returnAmount),
            buyBack: new BN(buyBackAmount),
            taxReceiver: new BN(taxAmount),
            rewards: new BN(rewardsAmount),
          },
        };
        
        const dispatchUsdcAccountsWhitelist: DispatchUsdcAccountsWhitelist = {
          user: user,
          userUsdcAccount,
          merchantUsdcAccount: merchantUsdcAta,
          taxReceiverTokenAccount,
          rewardsUsdcAccount: rewardsUsdcAccount!,
          buyBackTokenAccount: merchantUsdcAta, // buy back is not supported for devnet
          tokenProgram: TOKEN_PROGRAM_ID,
          stakeRewardsState: stakeRewardsState,
          vaultAuthority: vaultAuthority,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          programId: stakeRewardsProgram,
        };

        const transaction = new Transaction();

        // create merchant usdc ata
        if (distribution.return_address) {
          try {
            await getAccount(this.connection, merchantUsdcAta);
          } catch (error) {
            // create merchant usdc ata
            transaction.add(
              createAssociatedTokenAccountInstruction(
                user, // payer
                merchantUsdcAta, // ata
                merchantAddress, // owner
                new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!) // mint
              )
            );
          }
        }

        // create tax receiver usdc ata
        try {
          await getAccount(this.connection, taxReceiverTokenAccount);
        } catch (error) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              user,
              taxReceiverTokenAccount,
              new PublicKey(distribution.tax_receiver),
              new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!)
            )
          );
        }

        // create rewards usdc ata
        if (distribution.rewards_contract) {
          try {
            await getAccount(this.connection, rewardsUsdcAccount!);
          } catch (error) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                user,
                rewardsUsdcAccount!,
                vaultAuthority,
                new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!)
              )
            );
          }
        }

        // add main transaction instruction
        const ix = dispatchUsdcWhitelist(dispatchArgsWhitelist, dispatchUsdcAccountsWhitelist, DISPATCH_INNER_PROGRAM_ID);
        transaction.add(ix);

        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = user;

        const signed = await window.solana.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(signed.serialize());

        callbacks?.onUpdate?.(signature, "Transaction submitted, waiting for confirmation...");
        
        return { success: true, signature: signature };
      } catch (error) {
        const err = error as Error;
        callbacks?.onError?.(err);
        return { success: false, error: err.message };
      }
    }

    async dispatchUsdcForNonWhitelistStakingProgram(
      user: PublicKey, 
      projectId: string, 
      amount: number,
      callbacks?: {
        onStart?: () => void;
        onUpdate?: (signature: string, message: string) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
      }
    ) {
      try {
        // get distribution info

        const distribution = await projectService.getDistributionInfo(projectId);

        // calculate amounts
        const taxAmount = amount * distribution.tax_percentage / 10000;
        const remainingAmount = amount - taxAmount;
        const returnAmount = remainingAmount * distribution.return_share / 10000;
        const buyBackAmount = 0; // buy back is not supported for devnet
        const rewardsAmount = remainingAmount - returnAmount - buyBackAmount;

        const [stakeRewardsState, stakeRewardsStateBump] = PublicKey.findProgramAddressSync(
          [Buffer.from("state")],
          new PublicKey(distribution.rewards_contract)
        );

        const [vaultAuthority, vaultAuthorityBump] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault")],
          new PublicKey(distribution.rewards_contract)
        );

        const [userInfo, userInfoBump] = PublicKey.findProgramAddressSync(
          [Buffer.from("user-info"), user.toBuffer()],
          new PublicKey(distribution.rewards_contract)
        );

        const userUsdcAccount = await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!),
          user,
          false
        );

        const merchantAddress = new PublicKey(distribution.return_address);
        const merchantUsdcAta = await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!),
          merchantAddress
        );

        const taxReceiverTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!),
          new PublicKey(distribution.tax_receiver)
        );

        const rewardsUsdcAccount = distribution.rewards_contract ? await getAssociatedTokenAddress(
          new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!), 
          new PublicKey(vaultAuthority),
          true
        ) : null;

        const dispatchArgs: DispatchUsdcArgsNonWhitelist = {
          amounts: {
            merchant: new BN(returnAmount),
            buyBack: new BN(buyBackAmount),
            taxReceiver: new BN(taxAmount),
            rewards: new BN(rewardsAmount),
          },
        };

        const dispatchUsdcAccounts: DispatchUsdcAccountsNonWhitelist = {
          user: user,
          userUsdcAccount,
          merchantUsdcAccount: merchantUsdcAta,
          taxReceiverTokenAccount,
          rewardsUsdcAccount: rewardsUsdcAccount!,
          buyBackTokenAccount: merchantUsdcAta, // buy back is not supported for devnet
          tokenProgram: TOKEN_PROGRAM_ID,
          stakeRewardsState: stakeRewardsState,
          vaultAuthority: vaultAuthority,
          userInfo,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          programId: new PublicKey(distribution.rewards_contract),
        };

        const transaction = new Transaction();

        // create merchant usdc ata
        if (distribution.return_address) {
          try {
            await getAccount(this.connection, merchantUsdcAta);
          } catch (error) {
            // create merchant usdc ata
            transaction.add(
              createAssociatedTokenAccountInstruction(
                user, // payer
                merchantUsdcAta, // ata
                merchantAddress, // owner
                new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!) // mint
              )
            );
          }
        }

        // create tax receiver usdc ata
        try {
          await getAccount(this.connection, taxReceiverTokenAccount);
        } catch (error) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              user,
              taxReceiverTokenAccount,
              new PublicKey(distribution.tax_receiver),
              new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!)
            )
          );
        }

        // create rewards usdc ata
        if (distribution.rewards_contract) {
          try {
            await getAccount(this.connection, rewardsUsdcAccount!);
          } catch (error) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                user,
                rewardsUsdcAccount!,
                vaultAuthority,
                new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!)
              )
            );
          }
        }

        const ix = dispatchUsdcNonWhitelist(dispatchArgs, dispatchUsdcAccounts, DISPATCH_PROGRAM_ID);
        transaction.add(ix);

        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = user;

        const signed = await window.solana.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(signed.serialize());

        callbacks?.onUpdate?.(signature, "Transaction submitted, waiting for confirmation...");
        
        return { success: true, signature: signature };

      } catch (error) {
        const err = error as Error;
        return { success: false, error: err.message };
      }
    }
}