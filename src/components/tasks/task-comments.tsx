"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  createTaskCommentAction,
  updateTaskCommentAction,
  deleteTaskCommentAction,
} from "@/app/(dashboard)/tasks/actions";
import { TaskCommentWithRelations } from "@/types/tasks";
import { Pencil, Trash2, Send } from "lucide-react";

interface TaskCommentsProps {
  comments: TaskCommentWithRelations[];
  taskId: string;
  currentUserId: string;
}

export function TaskComments({
  comments,
  taskId,
  currentUserId,
}: TaskCommentsProps) {
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setError(null);
    setIsSubmitting(true);
    const result = await createTaskCommentAction(taskId, newComment);
    if (result.success) {
      setNewComment("");
      router.refresh();
    } else if (result.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  }

  async function handleUpdate(commentId: string) {
    if (!editContent.trim()) return;

    setError(null);
    setIsSubmitting(true);
    const result = await updateTaskCommentAction(commentId, editContent, taskId);
    if (result.success) {
      setEditingId(null);
      setEditContent("");
      router.refresh();
    } else if (result.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setError(null);
    setIsSubmitting(true);
    const result = await deleteTaskCommentAction(commentId, taskId);
    if (result.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">
        Comments ({comments.length})
      </h3>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          maxLength={2000}
          aria-label="Comment content"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No comments yet.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {comment.author?.full_name || comment.author?.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-[10px] text-muted-foreground">
                          (edited)
                        </span>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                          maxLength={2000}
                          aria-label="Edit comment"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(comment.id)}
                          disabled={isSubmitting || !editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>

                  {comment.author_id === currentUserId && editingId !== comment.id && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        aria-label="Edit comment"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isSubmitting}
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
