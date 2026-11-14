"use client";

import { useState } from "react";
import { setLetterFavorite, setLetterReaction } from "@/actions/mail";
import { finishTopLoading, startTopLoading } from "@/lib/top-loading";
import { showToast } from "@/lib/toast";

const options = ["♥", "☺", "✿", "☀"];

export default function LetterResponseTools({ id, initialFavorite, initialReaction }: { id: string; initialFavorite: boolean; initialReaction: string }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [reaction, setReaction] = useState(initialReaction);

  async function toggle() {
    startTopLoading();
    try {
      const next = !favorite;
      const result = await setLetterFavorite(id, next);
      if (result.ok) {
        setFavorite(next);
        showToast(next ? "Saved to your favorites." : "Removed from your favorites.");
      } else showToast(result.error || "Could not update favorite.", "error");
    } catch {
      showToast("Could not update favorite. Please try again.", "error");
    } finally {
      finishTopLoading();
    }
  }

  async function react(emoji: string) {
    startTopLoading();
    try {
      const result = await setLetterReaction(id, emoji);
      if (result.ok) {
        setReaction(emoji);
        showToast("Your feeling has been sent.");
      } else showToast(result.error || "Could not add reaction.", "error");
    } catch {
      showToast("Could not send your feeling. Please try again.", "error");
    } finally {
      finishTopLoading();
    }
  }

  return <div className="letter-response"><button className={favorite ? "favorite active" : "favorite"} onClick={toggle} aria-pressed={favorite}>{favorite ? "♥" : "♡"} {favorite ? "Saved to favorites" : "Keep this letter"}</button><div><span>Send a little feeling</span>{options.map(emoji => <button key={emoji} className={reaction === emoji ? "reaction active" : "reaction"} aria-label={`React ${emoji}`} onClick={() => react(emoji)}>{emoji}</button>)}</div></div>;
}
