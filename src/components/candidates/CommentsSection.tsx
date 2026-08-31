import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface CommentsSectionProps {
  candidateId: string;
  applicationId?: string;
}

export const CommentsSection = ({ candidateId, applicationId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchComments();
  }, [candidateId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      // Get user's org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setOrgId(profile.org_id);
      }
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_comments')
        .select(`
          id,
          content,
          created_at,
          user:profiles!candidate_comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments = (data || []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: comment.user,
      }));

      setComments(formattedComments);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId || !orgId) return;

    try {
      const { error } = await supabase
        .from('candidate_comments')
        .insert({
          candidate_id: candidateId,
          application_id: applicationId,
          user_id: currentUserId,
          org_id: orgId,
          content: newComment.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });

      setNewComment('');
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="flex flex-col max-h-[600px]">
      <CardHeader>
        <CardTitle className="text-lg">Comments</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto min-h-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => {
              const isCurrentUser = comment.user.id === currentUserId;
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {comment.user.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        isCurrentUser
                          ? 'bg-[#256FFF] text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-white/90' : 'text-muted-foreground'}`}>
                        {comment.user.full_name}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <Button
            onClick={handleAddComment}
            size="icon"
            disabled={!newComment.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
