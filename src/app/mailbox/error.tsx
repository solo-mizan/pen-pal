"use client";

export default function MailboxError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="auth-needed"><span>✉</span><h1>Your mailbox couldn’t be opened just now.</h1><p>Your letters are still safe. Please try once more in a moment.</p>{error.digest&&<small className="error-reference">Reference: {error.digest}</small>}<button className="button" onClick={() => reset()}>Try again</button></main>;
}
