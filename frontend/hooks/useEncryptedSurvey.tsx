/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useAccount, usePublicClient } from "wagmi";
import type { Abi } from "viem";

import { EncryptedSurveyABI } from "@/abi/EncryptedSurveyABI";
import { EncryptedSurveyAddresses } from "@/abi/EncryptedSurveyAddresses";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

type ContractInfo = {
  abi: Abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

type DecryptedTallies = Array<number | null>;

const INITIAL_MOCK_CHAINS: Readonly<Record<number, string>> = {
  31337: "http://localhost:8545",
};

export function useEncryptedSurvey() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { storage } = useInMemoryStorage();

  const eip1193Provider =
    typeof window !== "undefined" ? (window as Window & { ethereum?: ethers.Eip1193Provider }).ethereum : undefined;

  const contractInfo: ContractInfo = useMemo(() => {
    if (!chain?.id) {
      return { abi: EncryptedSurveyABI.abi };
    }

    const entry = EncryptedSurveyAddresses[chain.id.toString() as keyof typeof EncryptedSurveyAddresses];
    if (!entry || entry.address === ethers.ZeroAddress) {
      return { abi: EncryptedSurveyABI.abi, chainId: chain.id };
    }

    return {
      abi: EncryptedSurveyABI.abi,
      address: entry.address as `0x${string}`,
      chainId: entry.chainId,
      chainName: entry.chainName,
    };
  }, [chain?.id]);

  const { instance, status: fheStatus } = useFhevm({
    provider: eip1193Provider,
    chainId: chain?.id,
    initialMockChains: INITIAL_MOCK_CHAINS,
  });

  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const [surveyDescription, setSurveyDescription] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [encryptedTallies, setEncryptedTallies] = useState<`0x${string}`[]>([]);
  const [decryptedTallies, setDecryptedTallies] = useState<DecryptedTallies>([]);
  const [authorizedViewers, setAuthorizedViewers] = useState<`0x${string}`[]>([]);
  const [adminAddress, setAdminAddress] = useState<`0x${string}` | undefined>(undefined);
  const [hasResponded, setHasResponded] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [surveyDeadline, setSurveyDeadline] = useState<bigint>(0n);

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState<boolean>(false);
  const [userVotes, setUserVotes] = useState<`0x${string}`[]>([]);
  const [surveyStats, setSurveyStats] = useState<{
    totalOptions: bigint;
    activeStatus: bigint;
    deadline: bigint;
    participantCount: bigint;
  } | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    optionIndices: readonly bigint[];
    optionLabels: readonly string[];
    totalParticipants: bigint;
  } | null>(null);
  const [viewerDetails, setViewerDetails] = useState<Record<string, {
    isAuthorized: boolean;
    role: bigint;
    expiry: bigint;
    hasAccess: boolean;
  }>>({});
  const [message, setMessage] = useState<string>("");

  const contractAddress = contractInfo.address;

  useEffect(() => {
    let isMounted = true;

    async function resolveSigner() {
      if (!address || !eip1193Provider) {
        if (isMounted) {
          setEthersSigner(undefined);
        }
        return;
      }

      try {
        const browserProvider = new ethers.BrowserProvider(eip1193Provider, chain?.id);
        const signer = await browserProvider.getSigner(address);
        if (isMounted) {
          setEthersSigner(signer);
        }
      } catch (error) {
        console.warn("[useEncryptedSurvey] Unable to create signer", error);
        if (isMounted) {
          setEthersSigner(undefined);
        }
      }
    }

    void resolveSigner();

    return () => {
      isMounted = false;
    };
  }, [address, chain?.id, eip1193Provider]);

  const refreshSurvey = useCallback(async () => {
    if (!publicClient || !contractAddress) {
      return;
    }

    setIsFetching(true);

    try {
      const aggregatedResults = await Promise.all([
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "surveyTitle",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "surveyDescription",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "optionsCount",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "getAllEncryptedTallies",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "authorizedViewers",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "admin",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "isActive",
        }),
        publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "surveyDeadline",
        }),
      ]);

      const [
        title,
        description,
        optionCount,
        tallies,
        viewers,
        admin,
        active,
        deadline,
      ] = aggregatedResults as [
        string,
        string,
        bigint,
        readonly `0x${string}`[],
        readonly `0x${string}`[],
        `0x${string}`,
        boolean,
        bigint,
      ];

      const optionLabels = await Promise.all(
        Array.from({ length: Number(optionCount) }, (_, index) =>
          publicClient.readContract({
            abi: contractInfo.abi,
            address: contractAddress,
            functionName: "getOptionLabel",
            args: [BigInt(index)],
          }) as Promise<string>,
        ),
      );

      setSurveyTitle(title);
      setSurveyDescription(description);
      setOptions(optionLabels);
      setEncryptedTallies(tallies.map((value) => value));
        setAuthorizedViewers(viewers.map((v) => v));
        setAdminAddress(admin);

        // Fetch viewer details
        const details: Record<string, any> = {};
        for (const viewer of viewers) {
          const viewerDetail = await publicClient.readContract({
            abi: contractInfo.abi,
            address: contractAddress,
            functionName: "getViewerDetails",
            args: [viewer],
          }) as readonly [boolean, bigint, bigint, boolean];
          details[viewer.toLowerCase()] = {
            isAuthorized: viewerDetail[0],
            role: viewerDetail[1],
            expiry: viewerDetail[2],
            hasAccess: viewerDetail[3],
          };
        }
        setViewerDetails(details);
      setIsActive(active);
      setSurveyDeadline(deadline);

      // Fetch survey statistics
      const stats = await publicClient.readContract({
        abi: contractInfo.abi,
        address: contractAddress,
        functionName: "getSurveyStats",
      }) as readonly [bigint, bigint, bigint, bigint];
      setSurveyStats({
        totalOptions: stats[0],
        activeStatus: stats[1],
        deadline: stats[2],
        participantCount: stats[3],
      });

      // Fetch result summary
      const summary = await publicClient.readContract({
        abi: contractInfo.abi,
        address: contractAddress,
        functionName: "getResultSummary",
      }) as readonly [readonly bigint[], readonly string[], bigint];
      setResultSummary({
        optionIndices: summary[0],
        optionLabels: summary[1],
        totalParticipants: summary[2],
      });

      if (address) {
        const responded = await publicClient.readContract({
          abi: contractInfo.abi,
          address: contractAddress,
          functionName: "hasResponded",
          args: [address],
        });
        setHasResponded(Boolean(responded));

        // Fetch user votes if they have responded
        if (address && Boolean(responded)) {
          const votes = await publicClient.readContract({
            abi: contractInfo.abi,
            address: contractAddress,
            functionName: "getUserVotes",
            args: [address],
          }) as readonly `0x${string}`[];
          setUserVotes(votes.map((v) => v));
        } else {
          setUserVotes([]);
        }
      } else {
        setHasResponded(false);
        setUserVotes([]);
      }
    } catch (error) {
      console.error("[useEncryptedSurvey] Unable to refresh survey data", error);
      setMessage("Failed to refresh survey data. Please try again.");
    } finally {
      setIsFetching(false);
    }
  }, [publicClient, contractAddress, contractInfo.abi, address]);

  useEffect(() => {
    setDecryptedTallies([]);
    if (contractAddress) {
      void refreshSurvey();
    }
  }, [contractAddress, refreshSurvey]);

  const submitResponse = useCallback(
    async (optionIndex: number) => {
      if (!contractAddress || !ethersSigner || !instance) {
        setMessage("Connect your wallet to submit a response.");
        return;
      }

      if (typeof optionIndex !== "number" || Number.isNaN(optionIndex)) {
        setMessage("Select an option before submitting.");
        return;
      }

      setIsSubmitting(true);
      setMessage("Encrypting your vote...");

      try {
        const input = instance.createEncryptedInput(
          contractAddress,
          await ethersSigner.getAddress(),
        );
        input.add32(1);
        const encrypted = await input.encrypt();

        setMessage("Submitting encrypted response...");
        const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
        const tx = await contract.submitResponse(optionIndex, encrypted.handles[0], encrypted.inputProof);
        await tx.wait();

        setMessage("Response submitted successfully.");
        await refreshSurvey();
      } catch (error) {
        console.error("[useEncryptedSurvey] submitResponse error", error);
        setMessage("Failed to submit your response. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [contractAddress, contractInfo.abi, ethersSigner, instance, refreshSurvey],
  );

  const submitBatchResponse = useCallback(
    async (optionIndices: number[]) => {
      if (!contractAddress || !ethersSigner || !instance) {
        setMessage("Connect your wallet to submit responses.");
        return;
      }

      if (typeof optionIndices === "undefined" || optionIndices.length === 0) {
        setMessage("Select at least one option before submitting.");
        return;
      }

      setIsBatchSubmitting(true);
      setMessage("Encrypting your batch responses...");

      try {
        const input = instance.createEncryptedInput(
          contractAddress,
          await ethersSigner.getAddress(),
        );

        // Add encrypted votes for each selected option
        for (let i = 0; i < optionIndices.length; i++) {
          input.add32(1);
        }

        const encrypted = await input.encrypt();

        setMessage("Submitting encrypted batch response...");
        const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);

        // Create arrays for the batch submission
        const encryptedVotes = encrypted.handles;
        const proofs = encrypted.inputProof;

        const tx = await contract.submitBatchResponse(optionIndices, encryptedVotes, proofs);
        await tx.wait();

        setMessage("Batch responses submitted successfully.");
        await refreshSurvey();
      } catch (error) {
        console.error("[useEncryptedSurvey] submitBatchResponse error", error);
        setMessage("Failed to submit your batch responses. Please try again.");
      } finally {
        setIsBatchSubmitting(false);
      }
    },
    [contractAddress, contractInfo.abi, ethersSigner, instance, refreshSurvey],
  );

  const decryptTallies = useCallback(async () => {
    if (!contractAddress || !instance || !ethersSigner) {
      setMessage("Connect an authorized wallet to decrypt results.");
      return;
    }

    const nonEmptyHandles = encryptedTallies.filter((value) => value !== ethers.ZeroHash);
    if (nonEmptyHandles.length === 0) {
      setDecryptedTallies(encryptedTallies.map(() => 0));
      setMessage("No responses submitted yet.");
      return;
    }

    setIsDecrypting(true);
    setMessage("Preparing decryption signature...");

    try {
      const signature = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress],
        ethersSigner,
        storage,
      );

      if (!signature) {
        setMessage("Unable to sign decryption request.");
        return;
      }

      setMessage("Decrypting aggregated tallies...");
      const decryptRequests = encryptedTallies
        .filter((handle) => handle !== ethers.ZeroHash)
        .map((handle) => ({
          handle,
          contractAddress,
        }));

      const result = await instance.userDecrypt(
        decryptRequests,
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        signature.userAddress,
        signature.startTimestamp,
        signature.durationDays,
      );

      const parsed: DecryptedTallies = encryptedTallies.map((handle) => {
        if (handle === ethers.ZeroHash) {
          return 0;
        }
        const decrypted = result[handle];
        if (typeof decrypted === "undefined") {
          return null;
        }
        return Number(decrypted);
      });

      setDecryptedTallies(parsed);
      setMessage("Tallies decrypted successfully.");
    } catch (error) {
      console.error("[useEncryptedSurvey] decryptTallies error", error);
      setMessage("Unable to decrypt tallies. Ensure this wallet is authorized.");
    } finally {
      setIsDecrypting(false);
    }
  }, [contractAddress, encryptedTallies, ethersSigner, instance, storage]);

  const authorizeViewer = useCallback(
    async (viewer?: string) => {
      if (!contractAddress || !ethersSigner) {
        setMessage("Connect with the survey administrator wallet.");
        return;
      }

      const targetViewer = viewer ?? address;
      if (!targetViewer) {
        setMessage("Provide a viewer address to authorize.");
        return;
      }

      setIsAuthorizing(true);
      setMessage("Authorizing viewer...");

      try {
        const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
        const tx = await contract.authorizeViewer(targetViewer);
        await tx.wait();

        setMessage("Viewer authorized. Refreshing data...");
        await refreshSurvey();
      } catch (error) {
        console.error("[useEncryptedSurvey] authorizeViewer error", error);
        setMessage("Failed to authorize viewer.");
      } finally {
        setIsAuthorizing(false);
      }
    },
    [address, contractAddress, contractInfo.abi, ethersSigner, refreshSurvey],
  );

  const isOnSupportedChain = Boolean(contractAddress);
  const normalizedViewers = useMemo(
    () => authorizedViewers.map((viewer) => viewer.toLowerCase()),
    [authorizedViewers],
  );

  const isAuthorizedViewer =
    address &&
    (address.toLowerCase() === adminAddress?.toLowerCase() || normalizedViewers.includes(address.toLowerCase()));

  const closeSurvey = useCallback(async () => {
    if (!contractAddress || !ethersSigner) {
      setMessage("Connect with the survey administrator wallet.");
      return;
    }

    setMessage("Closing survey...");

    try {
      const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
      const tx = await contract.closeSurvey();
      await tx.wait();

      setMessage("Survey closed successfully.");
      await refreshSurvey();
    } catch (error) {
      console.error("[useEncryptedSurvey] closeSurvey error", error);
      setMessage("Failed to close survey.");
    }
  }, [contractAddress, contractInfo.abi, ethersSigner, refreshSurvey]);

  const reopenSurvey = useCallback(async () => {
    if (!contractAddress || !ethersSigner) {
      setMessage("Connect with the survey administrator wallet.");
      return;
    }

    setMessage("Reopening survey...");

    try {
      const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
      const tx = await contract.reopenSurvey();
      await tx.wait();

      setMessage("Survey reopened successfully.");
      await refreshSurvey();
    } catch (error) {
      console.error("[useEncryptedSurvey] reopenSurvey error", error);
      setMessage("Failed to reopen survey.");
    }
  }, [contractAddress, contractInfo.abi, ethersSigner, refreshSurvey]);

  const extendDeadline = useCallback(async (newDeadline: number) => {
    if (!contractAddress || !ethersSigner) {
      setMessage("Connect with the survey administrator wallet.");
      return;
    }

    setMessage("Extending survey deadline...");

    try {
      const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
      const tx = await contract.extendDeadline(BigInt(newDeadline));
      await tx.wait();

      setMessage("Survey deadline extended successfully.");
      await refreshSurvey();
    } catch (error) {
      console.error("[useEncryptedSurvey] extendDeadline error", error);
      setMessage("Failed to extend survey deadline.");
    }
  }, [contractAddress, contractInfo.abi, ethersSigner, refreshSurvey]);

  const withdrawAndResubmit = useCallback(async () => {
    if (!contractAddress || !ethersSigner) {
      setMessage("Connect your wallet to withdraw your vote.");
      return;
    }

    setMessage("Withdrawing your vote...");

    try {
      const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
      const tx = await contract.withdrawAndResubmit();
      await tx.wait();

      setMessage("Vote withdrawn successfully. You can now resubmit.");
      await refreshSurvey();
    } catch (error) {
      console.error("[useEncryptedSurvey] withdrawAndResubmit error", error);
      setMessage("Failed to withdraw vote.");
    }
  }, [contractAddress, contractInfo.abi, ethersSigner, refreshSurvey]);

  const revokeViewer = useCallback(async (viewer: string) => {
    if (!contractAddress || !ethersSigner) {
      setMessage("Connect with the survey administrator wallet.");
      return;
    }

    setMessage("Revoking viewer access...");

    try {
      const contract = new ethers.Contract(contractAddress, contractInfo.abi, ethersSigner);
      const tx = await contract.revokeViewer(viewer);
      await tx.wait();

      setMessage("Viewer access revoked successfully.");
      await refreshSurvey();
    } catch (error) {
      console.error("[useEncryptedSurvey] revokeViewer error", error);
      setMessage("Failed to revoke viewer access.");
    }
  }, [contractAddress, contractInfo.abi, ethersSigner, refreshSurvey]);

  return {
    surveyTitle,
    surveyDescription,
    options,
    encryptedTallies,
    decryptedTallies,
    hasResponded,
    authorizedViewers,
    adminAddress,
    isAuthorizedViewer,
    isOnSupportedChain,
    contractAddress,
    message,
    isFetching,
    isSubmitting,
    isDecrypting,
    isAuthorizing,
    isBatchSubmitting,
    fheStatus,
    isActive,
    surveyDeadline,
    userVotes,
    surveyStats,
    resultSummary,
    viewerDetails,
    refreshSurvey,
    submitResponse,
    submitBatchResponse,
    decryptTallies,
    authorizeViewer,
    closeSurvey,
    reopenSurvey,
    extendDeadline,
    withdrawAndResubmit,
    revokeViewer,
  };

}
