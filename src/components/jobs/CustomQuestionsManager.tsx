import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  order_idx: number;
}

interface CustomQuestionsManagerProps {
  jobId: string;
}

export const CustomQuestionsManager = ({ jobId }: CustomQuestionsManagerProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text',
    options: [''],
    is_required: false,
  });

  useEffect(() => {
    fetchQuestions();
  }, [jobId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('application_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('order_idx');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const { error } = await supabase
        .from('application_questions')
        .insert({
          job_id: jobId,
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          options: newQuestion.question_type === 'multiple_choice' 
            ? newQuestion.options.filter(o => o.trim()) 
            : null,
          is_required: newQuestion.is_required,
          order_idx: questions.length,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Question added successfully',
      });

      setNewQuestion({
        question_text: '',
        question_type: 'text',
        options: [''],
        is_required: false,
      });
      setShowAddForm(false);
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('application_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });

      fetchQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    setDeleteConfirm(null);
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 1) {
      const newOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({ ...newQuestion, options: newOptions });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg">Custom Application Questions</h3>
          <p className="text-sm text-muted-foreground">
            Add custom questions to your application form
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter your question..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Question Type *</Label>
              <Select
                value={newQuestion.question_type}
                onValueChange={(value: any) => setNewQuestion({ ...newQuestion, question_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Short Text</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="yes_no">Yes/No</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newQuestion.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Options</Label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={newQuestion.options.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption} className="w-full">
                  Add Option
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={newQuestion.is_required}
                onCheckedChange={(checked) => 
                  setNewQuestion({ ...newQuestion, is_required: checked as boolean })
                }
              />
              <Label htmlFor="required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddQuestion} disabled={!newQuestion.question_text}>
                Add Question
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No custom questions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add questions to collect additional information from applicants
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {index + 1}. {question.question_text}
                          {question.is_required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Type: {question.question_type.replace('_', ' ')}
                        </p>
                        {question.question_type === 'multiple_choice' && question.options && (
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">Options:</p>
                            <ul className="list-disc list-inside ml-2">
                              {question.options.map((option, i) => (
                                <li key={i}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteQuestion(deleteConfirm)}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};
