"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { setLetterFavorite } from "@/actions/mail";
import { finishTopLoading, startTopLoading } from "@/lib/top-loading";
import { showToast } from "@/lib/toast";

export default function LetterResponseTools({ id, initialFavorite }: { id: string; initialFavorite: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  async function toggle() {
    startTopLoading();
    try {
      const next = !favorite;
      const result = await setLetterFavorite(id, next);
      if (result.ok) { setFavorite(next); showToast(next ? "Tucked away with your keepsakes." : "Removed from your keepsakes."); }
      else showToast(result.error || "Could not update this keepsake.", "error");
    } catch { showToast("Could not update this keepsake. Please try again.", "error"); }
    finally { finishTopLoading(); }
  }
  const Icon = favorite ? BookmarkCheck : Bookmark;
  return <div className="letter-response"><button type="button" className={favorite ? "favorite active" : "favorite"} onClick={toggle} aria-pressed={favorite}><Icon size={18} /> {favorite ? "Kept in your box" : "Keep this letter"}</button></div>;
}
