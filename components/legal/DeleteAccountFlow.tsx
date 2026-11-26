"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  cancelAccountDeletionAction,
  deleteVerifiedAccountAction,
  verifyDeletionAccountAction,
  type DeletionAccount,
} from "@/actions/account-deletion.action";
import { INITIAL_USER, useUserContext } from "@/context/AuthProvider";
import { handleClearStorage } from "@/lib/functions/auth.functions";

export default function DeleteAccountFlow() {
  const { setUser } = useUserContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState<DeletionAccount | null>(null);
  const [pending, setPending] = useState<"verify" | "delete" | "cancel" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);
  const busy = useRef(false);

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current || deleted) return;
    busy.current = true;
    setPending("verify");
    setError("");
    try {
      const result = await verifyDeletionAccountAction({ email, password });
      if (result?.status !== "7400") {
        setError(
          result?.message || "Unable to verify your account. Please try again.",
        );
        return;
      }
      setPassword("");
      setAccount(result.account);
    } catch {
      setError("Unable to verify your account. Please try again.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  };

  const cancel = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending("cancel");
    try {
      const result = await cancelAccountDeletionAction();
      if (!result?.success) {
        setError("Unable to close verification. Please try again.");
        return;
      }
      setAccount(null);
      setError("");
    } catch {
      setError("Unable to close verification. Please try again.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  };

  const remove = async () => {
    if (!account || busy.current || deleted) return;
    busy.current = true;
    setPending("delete");
    setError("");
    try {
      const result = await deleteVerifiedAccountAction(account.id, true);
      if (result?.status !== "7400") {
        if (result?.reauthenticate) setAccount(null);
        setError(
          result?.message || "Unable to delete your account. Please try again.",
        );
        return;
      }
      setDeleted(true);
      setAccount(null);
      setUser(INITIAL_USER);
      try {
        await handleClearStorage();
      } catch {}
    } catch {
      setError("Unable to confirm account deletion. Please try again.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  };

  if (deleted)
    return (
      <section
        role="status"
        className="mx-auto max-w-xl rounded-[28px] border border-dark-400 bg-dark-250 p-8 text-center"
      >
        <h1 className="text-3xl font-semibold">Account deleted</h1>
        <p className="mt-4 leading-7 text-light-700">
          Your account has been deleted permanently. You have been signed out on
          this browser.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-dark-300 px-6 py-3 text-sm font-medium"
        >
          Back to home
        </a>
      </section>
    );

  return (
    <>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-[28px] border border-dark-400 bg-dark-250">
          <div className="bg-[#0a1938] p-7 text-white sm:p-8">
            <span className="inline-block rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
              Talents Explore account deletion
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
              Delete your account
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/85">
              Sign in first so we can verify that you own the account before
              asking for final confirmation.
            </p>
          </div>
          <div className="p-7 sm:p-8">
            <h2 className="text-xl font-semibold">What happens next</h2>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-light-700">
              <li>
                Enter the email and password for the account you want to delete.
              </li>
              <li>Review the verified account details.</li>
              <li>
                Confirm permanent deletion, or cancel to keep your account.
              </li>
              <li>After successful deletion, you are signed out.</li>
            </ol>
            <p className="mt-5 text-sm leading-6 text-light-600">
              This permanently deletes your account and associated data. Some
              information may be retained for legal or security requirements, as
              described in our{" "}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
        <section className="rounded-[28px] border border-dark-400 bg-dark-250 p-7 sm:p-8">
          <h2 className="text-2xl font-semibold">Verify your account</h2>
          <p className="mt-3 text-sm leading-6 text-light-700">
            Use the credentials of the account you want to delete. Your account
            will remain active until you confirm deletion.
          </p>
          <form onSubmit={verify} className="mt-6 flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm">
              Email
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!!pending}
                className="h-12 bg-dark-300"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor="delete-account-password">Password</label>
              <PasswordInput
                id="delete-account-password"
                name="password"
                autoComplete="current-password"
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!!pending}
                className="h-12 bg-dark-300"
              />
            </div>
            {error && !account && (
              <p
                role="alert"
                className="text-sm text-red-700 dark:text-red-300"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={!!pending}
              className="shad-button_primary"
            >
              {pending === "verify" ? "Verifying..." : "Sign in to continue"}
            </Button>
            <Link
              href="/forgot-password"
              className="text-sm text-light-700 underline"
            >
              Forgot your password?
            </Link>
          </form>
        </section>
      </div>
      <AlertDialog
        open={!!account}
        onOpenChange={(open) => {
          if (!open && !busy.current) cancel();
        }}
      >
        <AlertDialogContent className="max-h-[90svh] overflow-y-auto rounded-2xl border-dark-400 bg-dark-250 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this account permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-light-700">
              This action cannot be undone. Your account and associated data
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-dark-400 bg-dark-300 p-4 text-sm leading-6">
            <p className="break-all font-medium">{account?.email}</p>
            {account?.username && (
              <p className="break-all text-light-600">@{account.username}</p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                disabled={!!pending}
                onClick={(event) => {
                  event.preventDefault();
                  return cancel();
                }}
              >
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!!pending}
              onClick={remove}
            >
              {pending === "delete" ? "Deleting..." : "Yes, delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
