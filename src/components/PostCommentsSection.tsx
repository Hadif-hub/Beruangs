import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BearComment } from "../types";
import { Send, Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PostCommentsSectionProps {
  post: {
    id: string;
    comments?: BearComment[];
  };
  user: any;
  onAddComment: (text: string) => Promise<void>;
}

export default function PostCommentsSection({ post, user, onAddComment }: PostCommentsSectionProps) {
  const [newCommentText, setNewCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const comments = post.comments || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newCommentText.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(newCommentText);
      setNewCommentText("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewCommentText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const quickEmojis = ["🐻", "🍯", "🐾", "🐟", "🌲", "❤️", "👍", "😮", "😂"];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="mt-4 pt-4 border-t border-bear-sand/70 overflow-hidden text-left"
    >
      <h5 className="text-[11px] font-mono font-bold text-bear-khaki tracking-wider uppercase mb-3.5">
        Species Discussion ({comments.length})
      </h5>

      {/* Write Comment Box */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-5 space-y-2.5">
          <div className="flex gap-3 items-start">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`}
              alt={user.displayName || "You"}
              className="h-8 w-8 rounded-full border border-bear-latte bg-bear-sand shrink-0 object-cover"
            />
            <div className="flex-1 relative">
              <textarea
                rows={2}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Log your comment about this sighting..."
                className="w-full text-xs font-medium p-3 pr-10 bg-bear-sand/20 border border-bear-latte/60 rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30 focus:bg-white resize-none leading-relaxed transition-all"
              />
              <div className="absolute right-3.5 bottom-3.5 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 rounded-md text-bear-khaki hover:text-bear-brown hover:bg-bear-sand/50 transition-colors cursor-pointer"
                  title="Emoji helper"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Emoji Picker & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pl-11">
            <AnimatePresence>
              {(showEmojiPicker || true) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 py-1"
                >
                  <span className="text-[10px] font-mono font-extrabold text-neutral-400 mr-1 select-none">Quick:</span>
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-sm p-1 hover:bg-bear-sand rounded-lg transition-colors cursor-pointer active:scale-90 select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="px-4 py-2 bg-bear-brown hover:bg-bear-dark disabled:bg-bear-khaki/35 text-white text-[11px] font-extrabold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:cursor-not-allowed select-none self-end"
            >
              <span>{submitting ? "Securing..." : "Send"}</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-5 p-3.5 bg-bear-sand/20 border border-bear-latte/50 rounded-2xl text-[11px] text-neutral-500 font-semibold flex items-center justify-between">
          <span>Sign in with your observer credentials to participate in this discussion.</span>
        </div>
      )}

      {/* Discussion List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-[11px] text-neutral-400 py-3 font-semibold text-center italic">
            No sighting logs registered here yet. Be the first to leave a comment!
          </p>
        ) : (
          comments
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((cmt) => (
              <div key={cmt.id} className="flex gap-3 items-start text-xs border-b border-bear-sand/30 pb-3 last:border-0 last:pb-0">
                <img
                  src={cmt.userPhotoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cmt.userId}`}
                  alt={cmt.userDisplayName}
                  className="h-7 w-7 rounded-full border border-bear-latte bg-bear-sand shrink-0 object-cover"
                />
                <div className="flex-1 leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-bear-dark text-[11px]">
                      {cmt.userDisplayName}
                    </span>
                    <span className="text-[9px] text-bear-khaki font-mono font-bold">
                      {new Date(cmt.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-bear-dark text-xs mt-1 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {cmt.text}
                  </p>
                </div>
              </div>
            ))
        )}
      </div>
    </motion.div>
  );
}
