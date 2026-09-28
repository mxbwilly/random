"use client";

import { useState, useTransition } from "react";
import { Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteComment } from "@/lib/comments/actions";
import { CommentForm } from "./comment-form";
import { timeAgo } from "@/lib/time";

type CommentData = {
  id: string;
  body: string;
  createdAt: Date;
  deletedAt: Date | null;
  author: { id: string; displayName: string; major: string | null };
};

export function CommentItem({
  comment,
  replies,
  target,
  currentUserId,
  isAdmin,
}: {
  comment: CommentData;
  replies: CommentData[];
  target: { examId: string } | { teacherId: string };
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [replying, setReplying] = useState(false);
  return (
    <li id={`comment-${comment.id}`} className="grid gap-3">
      <CommentBody comment={comment} currentUserId={currentUserId} isAdmin={isAdmin} onReply={() => setReplying((r) => !r)} />
      {(replies.length > 0 || replying) && (
        <div className="ml-6 grid gap-3 border-l pl-4">
          {replies.map((r) => (
            <CommentBody key={r.id} comment={r} currentUserId={currentUserId} isAdmin={isAdmin} />
          ))}
          {replying && (
            <CommentForm target={target} parentId={comment.id} placeholder={`Reply to ${comment.author.displayName}`} compact onDone={() => setReplying(false)} />
          )}
        </div>
      )}
    </li>
  );
}

function CommentBody({ comment, currentUserId, isAdmin, onReply }: { comment: CommentData; currentUserId: string; isAdmin: boolean; onReply?: () => void }) {
  const [pending, start] = useTransition();
  const canDelete = !comment.deletedAt && (comment.author.id === currentUserId || isAdmin);
  return (
    <div className="grid gap-1 text-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{comment.author.displayName}</span>
        {comment.author.major && <span>· {comment.author.major}</span>}
        <span>· {timeAgo(comment.createdAt)}</span>
        <span className="ml-auto flex items-center gap-1">
          {onReply && !comment.deletedAt && (
            <Button type="button" variant="ghost" size="xs" onClick={onReply}><Reply />Reply</Button>
          )}
          {canDelete && (
            <Button type="button" variant="ghost" size="xs" className="text-destructive" disabled={pending} onClick={() => start(() => deleteComment(comment.id))}><Trash2 />Delete</Button>
          )}
        </span>
      </div>
      {comment.deletedAt ? <p className="italic text-muted-foreground">Comment deleted.</p> : <p className="whitespace-pre-wrap">{comment.body}</p>}
    </div>
  );
}
