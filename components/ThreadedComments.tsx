import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { EmojiReactions } from "./emoji-reactions";

export interface ThreadedComment {
  id: string;
  parent_id?: string | null;
  user_id: string;
  content: string;
  created_at: any;
  // ...other fields
}

interface UserMap {
  [key: string]: {
    username: string;
    avatar_url?: string;
  };
}

interface ThreadedCommentsProps {
  comments: ThreadedComment[];
  userMap: UserMap;
  currentUserId?: string;
  collectionName: string;
  addComment: (content: string, parentId?: string | null) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  shareComment: (commentId: string) => void;
  parentId?: string | null;
  depth?: number;
  canDeleteAny?: boolean; // owner-level delete permission
}

export const ThreadedComments: React.FC<ThreadedCommentsProps> = ({
  comments,
  userMap,
  currentUserId,
  collectionName,
  addComment,
  editComment,
  deleteComment,
  shareComment,
  parentId = null,
  depth = 0,
  canDeleteAny = false,
}) => {
  const commentsForLevel = comments.filter(c => (c.parent_id ?? null) === parentId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;
    await addComment(replyText, parentCommentId);
    setReplyingTo(null);
    setReplyText("");
  };
  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    await editComment(commentId, editText);
    setEditingId(null);
    setEditText("");
  };

  const treeIndentClass = depth > 0 ? "pl-4 border-l-2 border-border" : "";

  return (
    <div className="space-y-6">
      {commentsForLevel.map(comment => {
        const user = userMap[comment.user_id];
        const isOwn = comment.user_id === currentUserId;
        const canEdit = isOwn;
        const canDelete = isOwn || canDeleteAny;
        return (
          <div key={comment.id} id={`comment-${comment.id}`} className={`${treeIndentClass}`}>
            <div className="rounded-lg border bg-card p-5 relative group transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3 mb-1">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{(user?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-foreground text-sm mb-1">{user?.username || "Unknown"}</div>
                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                      <span>{comment.created_at?.toDate?.()?.toLocaleDateString?.() || "Recently"}</span>
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition flex gap-1">
                        <Button size="icon-sm" variant="ghost" tabIndex={-1} onClick={() => setReplyingTo(comment.id)}><span className="sr-only">Reply</span><svg width="16" height="16" fill="none"><path d="M10 12l-4-4 4-4" stroke="currentColor" strokeWidth="2"/></svg></Button>
                        {canEdit && (
                          <Button size="icon-sm" variant="ghost" tabIndex={-1} onClick={() => {setEditingId(comment.id);setEditText(comment.content)}}><span className="sr-only">Edit</span><svg width="16" height="16" fill="none"><path d="M2 13.5V11a2 2 0 012-2h8a2 2 0 012 2v2.5" stroke="currentColor" strokeWidth="2"/><path d="M9.057 3.614a1.8 1.8 0 012.544 2.544l-7.66 7.66-2.122.707.707-2.121 7.66-7.66z" stroke="currentColor" strokeWidth="2"/></svg></Button>
                        )}
                        {canDelete && (
                          <Button size="icon-sm" variant="ghost" tabIndex={-1} onClick={() => setDeleteConfirmId(comment.id)}><span className="sr-only">Delete</span><svg width="16" height="16" fill="none"><path d="M2 4h12M7 8v4m2-4v4M6 4V2a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/></svg></Button>
                        )}
                        <Button size="icon-sm" variant="ghost" tabIndex={-1} onClick={() => shareComment(comment.id)}><span className="sr-only">Share</span><svg width="16" height="16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/><path d="M8 6V10M8 10L6 8M8 10l2-2" stroke="currentColor" strokeWidth="2"/></svg></Button>
                      </div>
                    </div>
                  </div>
                  {editingId === comment.id ? (
                    <div className="mt-2">
                      <Textarea value={editText} autoFocus onChange={e => setEditText(e.target.value)} rows={2} className="mb-2" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(comment.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground whitespace-pre-wrap mt-1 text-sm">{comment.content}</p>
                  )}
                  <EmojiReactions parentId={comment.id} collectionName={collectionName} />
                  {replyingTo === comment.id && (
                    <div className="mt-2">
                      <Textarea value={replyText} autoFocus onChange={e => setReplyText(e.target.value)} rows={2} className="mb-2" placeholder="Reply..." />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReply(comment.id)}>Reply</Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  {deleteConfirmId === comment.id && (
                    <div className="absolute top-2 right-2 z-20 bg-background border rounded py-2 px-4 shadow flex flex-col gap-2">
                      <span>Are you sure?</span>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="destructive" onClick={() => {deleteComment(comment.id);setDeleteConfirmId(null);}}>Delete</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ThreadedComments
              comments={comments}
              userMap={userMap}
              currentUserId={currentUserId}
              collectionName={collectionName}
              addComment={addComment}
              editComment={editComment}
              deleteComment={deleteComment}
              shareComment={shareComment}
              parentId={comment.id}
              depth={depth+1}
              canDeleteAny={canDeleteAny}
            />
          </div>
        )
      })}
    </div>
  );
};
