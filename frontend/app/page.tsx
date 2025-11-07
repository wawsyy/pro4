"use client";

import { useMemo, useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import clsx from "clsx";
import { useAccount } from "wagmi";

import { Logo } from "@/components/Logo";
import { useEncryptedSurvey } from "@/hooks/useEncryptedSurvey";

function truncate(value: string) {
  if (!value || value === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return "0x0";
  }
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export default function Home() {
  const { address } = useAccount();
  const {
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
  } = useEncryptedSurvey();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [viewerAddress, setViewerAddress] = useState<string>("");
  const [newDeadline, setNewDeadline] = useState<string>("");

  const fallbackTitle = surveyTitle || "Employee Experience Pulse 2025";
  const fallbackDescription =
    surveyDescription ||
    "Capture encrypted, privacy-preserving responses on culture, wellbeing, and enablement. Results are aggregated homomorphically and shared only with authorized leadership.";

  const cardOptions = useMemo(
    () =>
      options.length > 0
        ? options
        : ["Our workspace", "Leadership support", "Tools & automation", "Career growth"],
    [options],
  );

  const canSubmit =
    ((selectedOption !== null && !isBatchMode) || (selectedOptions.size > 0 && isBatchMode)) &&
    !isSubmitting &&
    !isBatchSubmitting &&
    !hasResponded &&
    isOnSupportedChain &&
    Boolean(contractAddress) &&
    isActive;

  const canDecrypt =
    !isDecrypting && isAuthorizedViewer && isOnSupportedChain && encryptedTallies.length > 0 && Boolean(contractAddress);

  const isAdmin =
    address && adminAddress ? address.toLowerCase() === adminAddress.toLowerCase() : false;

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-12">
        <Logo />
        <ConnectButton accountStatus="address" showBalance={false} chainStatus="icon" />
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="glass-panel mt-10 rounded-3xl border border-white/10 px-8 py-10 shadow-2xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="chip">Encrypted survey workflow</span>
              <button
                onClick={() => {
                  void refreshSurvey();
                }}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Refresh data ↻
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold text-white md:text-4xl lg:text-5xl">{fallbackTitle}</h1>
              <p className="max-w-3xl text-lg text-slate-300">{fallbackDescription}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Encrypted capture",
                  body: "Employees submit answers locally encrypted in the browser.",
                },
                {
                  title: "Zero-trust analysis",
                  body: "Aggregations run directly on ciphertext inside the smart contract.",
                },
                {
                  title: "Controlled insights",
                  body: "Only authorized leaders decrypt the final tallies for decision making.",
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/5 bg-white/5 p-5 text-slate-200 backdrop-blur"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                    Step {idx + 1}
                  </div>
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm text-slate-300/90">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section className="glass-panel rounded-3xl px-8 py-8">
            <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Survey form</div>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">Submit your encrypted response</h2>
              <p className="text-sm text-slate-300">
                Select the option that best reflects your current sentiment. Your answer is never visible in plaintext to
                the contract or operator—only the final aggregate can be decrypted by authorized viewers.
                {!isActive && <span className="text-amber-300"> Survey is currently closed.</span>}
              </p>
            </header>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isBatchMode}
                  onChange={(e) => {
                    setIsBatchMode(e.target.checked);
                    if (e.target.checked) {
                      setSelectedOption(null);
                    } else {
                      setSelectedOptions(new Set());
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-400 text-indigo-400 focus:ring-indigo-400"
                />
                Enable batch mode (select multiple options)
              </label>
            </div>
            <form className="mt-6 space-y-4">
              {cardOptions.map((optionLabel, index) => {
                const isSelected = isBatchMode ? selectedOptions.has(index) : selectedOption === index;
                const disabled = hasResponded;

                const handleToggle = () => {
                  if (isBatchMode) {
                    const newSelected = new Set(selectedOptions);
                    if (newSelected.has(index)) {
                      newSelected.delete(index);
                    } else {
                      newSelected.add(index);
                    }
                    setSelectedOptions(newSelected);
                  } else {
                    setSelectedOption(selectedOption === index ? null : index);
                  }
                };

                return (
                  <label
                    key={optionLabel}
                    className={clsx(
                      "flex cursor-pointer items-center justify-between rounded-2xl border px-5 py-4 transition",
                      "border-white/5 bg-white/3 hover:bg-white/10 focus-within:outline focus-within:outline-2 focus-within:outline-slate-300/50",
                      isSelected && "border-indigo-400/80 bg-indigo-400/15",
                      disabled && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-white">{optionLabel}</span>
                      <span className="text-sm text-slate-300/80">
                        {index === 0 && "Celebrate what is working well"}
                        {index === 1 && "Highlight supportive leadership behaviours"}
                        {index === 2 && "Spot neutral sentiment to improve"}
                        {index === 3 && "Surface blockers and concerns"}
                        {index > 3 && "Share how this experience feels today"}
                      </span>
                    </div>
                    <input
                      type={isBatchMode ? "checkbox" : "radio"}
                      name={isBatchMode ? `survey-option-${index}` : "survey-option"}
                      value={index}
                      checked={isSelected}
                      disabled={disabled}
                      onChange={handleToggle}
                      className="h-5 w-5 cursor-pointer accent-indigo-400"
                    />
                  </label>
                );
              })}
            </form>
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={() => {
                  if (isBatchMode) {
                    void submitBatchResponse(Array.from(selectedOptions));
                  } else if (selectedOption !== null) {
                    void submitResponse(selectedOption);
                  }
                }}
                disabled={!canSubmit}
                className={clsx(
                  "inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition md:w-auto",
                  canSubmit
                    ? "bg-indigo-500 text-white hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80"
                    : "cursor-not-allowed bg-white/10 text-slate-400",
                )}
              >
                {isSubmitting || isBatchSubmitting
                  ? "Encrypting & submitting…"
                  : hasResponded
                    ? "Response captured"
                    : isBatchMode
                      ? `Submit ${selectedOptions.size} encrypted votes`
                      : "Submit encrypted vote"}
              </button>
              <p className="text-xs text-slate-400">
                Ciphertexts refresh automatically. Admins can decrypt final tallies with the button on the right.
              </p>
            </div>
            {message && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200">
                {message}
              </div>
            )}

            {hasResponded && userVotes.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300 mb-3">Your votes</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {userVotes.map((voteIndex, idx) => {
                    const optionIndex = Number(voteIndex);
                    const optionLabel = cardOptions[optionIndex] || `Option ${optionIndex}`;
                    return (
                      <span key={idx} className="rounded-full bg-indigo-400/20 px-3 py-1 text-sm text-indigo-200">
                        {optionLabel}
                      </span>
                    );
                  })}
                </div>
                {isActive && (
                  <button
                    type="button"
                    onClick={() => withdrawAndResubmit()}
                    className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80"
                  >
                    Withdraw & Resubmit
                  </button>
                )}
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <div className="glass-panel rounded-3xl px-6 py-6">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Live status</div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">FHE instance</span>
                  <span className="font-medium text-white">{fheStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Survey contract</span>
                  <span className="font-medium text-white">
                    {isOnSupportedChain && contractAddress ? truncate(contractAddress) : "Unsupported network"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Your authorization</span>
                  <span
                    className={clsx(
                      "font-semibold",
                      isAuthorizedViewer ? "text-emerald-300" : "text-amber-300",
                    )}
                  >
                    {isAuthorizedViewer ? "Authorized" : "Not authorized"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Survey progress</span>
                  <span className="font-medium text-white">
                    {isFetching ? "Refreshing…" : `${encryptedTallies.length || cardOptions.length} options`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Survey status</span>
                  <span
                    className={clsx(
                      "font-semibold",
                      isActive ? "text-emerald-300" : "text-amber-300",
                    )}
                  >
                    {isActive ? "Active" : "Closed"}
                  </span>
                </div>
                {surveyDeadline > 0n && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deadline</span>
                    <span className="font-medium text-white">
                      {new Date(Number(surveyDeadline) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {surveyStats && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Participation</span>
                    <span className="font-medium text-white">
                      {Number(surveyStats.participantCount)} responses
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => decryptTallies()}
                  disabled={!canDecrypt}
                  className={clsx(
                    "inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
                    canDecrypt
                      ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80"
                      : "cursor-not-allowed bg-white/10 text-slate-400",
                  )}
                >
                  {isDecrypting ? "Decrypting…" : "Decrypt aggregated tallies"}
                </button>
                {isAdmin ? (
                  <div className="mt-2 space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                      Share decrypted results with wallet
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={viewerAddress}
                        onChange={(event) => setViewerAddress(event.target.value)}
                        placeholder="0x..."
                        className="flex-1 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = viewerAddress.trim();
                          if (trimmed) {
                            void authorizeViewer(trimmed);
                          }
                        }}
                        disabled={isAuthorizing || viewerAddress.trim() === "" || !isOnSupportedChain}
                        className={clsx(
                          "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
                          !isAuthorizing && viewerAddress.trim() && isOnSupportedChain
                            ? "bg-white text-slate-900 hover:bg-slate-100"
                            : "cursor-not-allowed bg-white/10 text-slate-400",
                        )}
                      >
                        {isAuthorizing ? "Authorizing…" : "Authorize"}
                      </button>
                    </div>
                  </div>
                ) : !isAuthorizedViewer ? (
                  <p className="text-xs text-slate-400">
                    Ask the administrator ({adminAddress ? truncate(adminAddress) : "admin"}) to whitelist your wallet.
                  </p>
                ) : null}
                {isAdmin && (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                      Survey management
                    </div>
                    <div className="flex flex-col gap-2">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => closeSurvey()}
                          className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80"
                        >
                          Close Survey
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => reopenSurvey()}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80"
                        >
                          Reopen Survey
                        </button>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="datetime-local"
                          value={newDeadline}
                          onChange={(event) => setNewDeadline(event.target.value)}
                          className="flex-1 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newDeadline) {
                              const timestamp = Math.floor(new Date(newDeadline).getTime() / 1000);
                              void extendDeadline(timestamp);
                              setNewDeadline("");
                            }
                          }}
                          disabled={!newDeadline}
                          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400 bg-indigo-500 text-white hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80"
                        >
                          Extend Deadline
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-3xl px-6 py-6">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Authorized viewers</div>
              <ul className="mt-4 space-y-2 text-xs text-slate-200">
                {authorizedViewers.length > 0 ? (
                  authorizedViewers.map((viewer) => {
                    const details = viewerDetails[viewer.toLowerCase()];
                    const roleLabels = ["Basic", "Analyst", "Admin"];

                    return (
                      <li key={viewer} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-slate-300">{truncate(viewer)}</span>
                          {details && (
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className={`rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wide ${
                                details.role === 2n ? "bg-purple-400/20 text-purple-200" :
                                details.role === 1n ? "bg-blue-400/20 text-blue-200" :
                                "bg-emerald-400/20 text-emerald-200"
                              }`}>
                                {roleLabels[Number(details.role)] || "Basic"}
                              </span>
                              {details.expiry > 0n && (
                                <span className="text-slate-400">
                                  Expires: {new Date(Number(details.expiry) * 1000).toLocaleDateString()}
                                </span>
                              )}
                              {!details.hasAccess && (
                                <span className="text-red-400">Access expired</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {viewer.toLowerCase() === adminAddress?.toLowerCase() ? (
                            <span className="rounded-full bg-indigo-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                              Admin
                            </span>
                          ) : (
                            isAdmin && (
                              <button
                                type="button"
                                onClick={() => revokeViewer(viewer)}
                                className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/30"
                              >
                                Revoke
                              </button>
                            )
                          )}
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="rounded-2xl bg-white/5 px-3 py-2 text-slate-400">No viewers authorized yet.</li>
                )}
              </ul>
            </div>
          </aside>
        </div>

        <section className="glass-panel mt-10 overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-8 py-6">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Survey Dashboard</div>
              <p className="text-sm text-slate-300">
                Real-time survey analytics and encrypted result visualization.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
              {decryptedTallies.length > 0 ? "Decryption complete" : "Encrypted"}
            </div>
          </div>

          {resultSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8 py-6 border-b border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{Number(resultSummary.totalParticipants)}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Total Responses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{resultSummary.optionLabels.length}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Survey Options</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{isActive ? "Active" : "Closed"}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Survey Status</div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-100">
              <thead>
                <tr>
                  <th className="px-8 py-4 font-semibold uppercase tracking-wider text-slate-300">Option</th>
                  <th className="px-8 py-4 font-semibold uppercase tracking-wider text-slate-300">Encrypted handle</th>
                  <th className="px-8 py-4 font-semibold uppercase tracking-wider text-slate-300">Decrypted tally</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cardOptions.map((optionLabel, index) => {
                  const encrypted = encryptedTallies[index] ?? "0x0";
                  const decrypted = decryptedTallies[index];

                  return (
                    <tr key={optionLabel}>
                      <td className="px-8 py-4 text-base font-medium text-white">{optionLabel}</td>
                      <td className="px-8 py-4 font-mono text-slate-300">{truncate(encrypted)}</td>
                      <td className="px-8 py-4 text-lg font-semibold">
                        {typeof decrypted === "number"
                          ? decrypted
                          : encrypted === "0x0"
                            ? 0
                            : decrypted === null
                              ? "Locked"
                              : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
