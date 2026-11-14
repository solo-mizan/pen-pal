"use client";

import { useState } from "react";
import { setLetterFavorite, setLetterReaction } from "@/actions/mail";
import { finishTopLoading, startTopLoading } from "@/lib/top-loading";

const options = ["♥", "☺", "✿", "☀"];

export default function LetterResponseTools({ id, initialFavorite, initialReaction }: { id: string; initialFavorite: boolean; initialReaction: string }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [reaction, setReaction] = useState(initialReaction);
  const [notice, setNotice] = useState("");

  async function toggle() {
    startTopLoading();
    try {
      const next = !favorite;
      const result = await setLetterFavorite(id, next);
      if (result.ok) setFavorite(next);
      else setNotice(result.error || "Could not update favorite.");
    } finally {
      finishTopLoading();
    }
  }

  async function react(emoji: string) {
    startTopLoading();
    try {
      const result = await setLetterReaction(id, emoji);
      if (result.ok) setReaction(emoji);
      else setNotice(result.error || "Could not add reaction.");
    } finally {
      finishTopLoading();
    }
  }

  return <div className="letter-response"><button className={favorite ? "favorite active" : "favorite"} onClick={toggle} aria-pressed={favorite}>{favorite ? "♥" : "♡"} {favorite ? "Saved to favorites" : "Keep this letter"}</button><div><span>Send a little feeling</span>{options.map(emoji => <button key={emoji} className={reaction === emoji ? "reaction active" : "reaction"} aria-label={`React ${emoji}`} onClick={() => react(emoji)}>{emoji}</button>)}</div>{notice && <small role="status">{notice}</small>}</div>;
}
