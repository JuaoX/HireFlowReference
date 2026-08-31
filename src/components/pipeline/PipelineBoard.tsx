// Pipeline Board Component - Updated Design
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, Pencil, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { BulkRejectDialog } from '@/components/pipeline/BulkRejectDialog';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Stage {
  id: string;
  name: string;
  order_idx: number;
  type: string;
}

interface ApplicationCard {
  id: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    location?: string | null;
  } | null;
  applied_at: string;
  current_stage_id: string | null;
}

interface PipelineBoardProps {
  jobId: string;
}

interface SortableApplicationProps {
  application: ApplicationCard;
  onClick: () => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const getStageColor = (index: number) => {
  const colors = [
    'bg-orange-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
  ];
  return colors[index % colors.length];
};

const SortableApplication = ({ application, onClick, isSelected, onToggleSelect }: SortableApplicationProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Safety check - should not render if candidate is null (filtered in fetchPipelineData)
  if (!application.candidate) {
    return null;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div 
        className={`bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md transition-all mb-3 ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={(e) => {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleSelect(application.id);
          } else {
            onClick();
          }
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={application.candidate.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(application.candidate.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{application.candidate.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {application.candidate.location || 'Location not specified'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
          </p>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

interface DroppableStageProps {
  id: string;
  children: React.ReactNode;
  isOver: boolean;
  stage: Stage;
  stageColor: string;
  candidateCount: number;
  onEditStage: () => void;
  isEditing: boolean;
  editingStageName: string;
  onEditingNameChange: (value: string) => void;
  onSaveStage: () => void;
  onCancelEdit: () => void;
}

const DroppableStage = ({ 
  id, 
  children, 
  isOver, 
  stage, 
  stageColor, 
  candidateCount,
  onEditStage,
  isEditing,
  editingStageName,
  onEditingNameChange,
  onSaveStage,
  onCancelEdit
}: DroppableStageProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[600px] rounded-lg border transition-colors bg-card overflow-hidden ${
        isOver ? 'border-primary' : 'border-border'
      }`}
    >
      {/* Stage Header */}
      <div className="bg-muted/30 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${stageColor}`}></div>
          {isEditing ? (
            <>
              <Input
                value={editingStageName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveStage();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <button 
                onClick={onSaveStage}
                className="p-1 hover:bg-green-100 rounded text-green-600"
                title="Save"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button 
                onClick={onCancelEdit}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="Cancel"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm flex-1">{stage.name}</h3>
              <button 
                onClick={onEditStage}
                className="p-1 hover:bg-muted rounded"
                title="Edit stage name"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="text-sm text-primary font-semibold">
                {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Stage Content */}
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
};

const PipelineBoard = ({ jobId }: PipelineBoardProps) => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollStart, setScrollStart] = useState({ x: 0, scrollLeft: 0 });
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canMovePipeline } = useUserPermissions();
  const hasMovePermission = canMovePipeline(jobId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchPipelineData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pipeline-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          fetchPipelineData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
        },
        () => {
          fetchPipelineData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const fetchPipelineData = async () => {
    try {
      const [stagesRes, appsRes] = await Promise.all([
        supabase
          .from('job_stages')
          .select('*')
          .eq('job_id', jobId)
          .order('order_idx'),
        supabase
          .from('applications')
          .select(`
            id,
            applied_at,
            current_stage_id,
            candidate:candidates(id, full_name, email, location)
          `)
          .eq('job_id', jobId)
          .in('state', ['active', 'hired']),
      ]);

      if (stagesRes.error) throw stagesRes.error;
      if (appsRes.error) throw appsRes.error;

      setStages(stagesRes.data || []);
      // Filter out applications with null candidates
      setApplications((appsRes.data || []).filter(app => app.candidate !== null));
    } catch (error: any) {
      toast({
        title: 'Error loading pipeline',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getApplicationsForStage = (stageId: string) => {
    return applications.filter((app) => app.current_stage_id === stageId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    // Check permission before moving
    if (!hasMovePermission) {
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to move candidates in the pipeline',
        variant: 'destructive',
      });
      return;
    }

    const applicationId = active.id as string;
    const newStageId = over.id as string;

    // Check if dropping on a stage
    const isStage = stages.some((s) => s.id === newStageId);
    if (!isStage) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ current_stage_id: newStageId })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Application moved',
        description: 'Successfully moved to new stage',
      });

      fetchPipelineData();
    } catch (error: any) {
      toast({
        title: 'Error moving application',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    setScrollStart({
      x: e.pageX - scrollContainerRef.current.offsetLeft,
      scrollLeft: scrollContainerRef.current.scrollLeft,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - scrollStart.x) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsScrolling(false);
  };

  const handleMouseLeave = () => {
    setIsScrolling(false);
  };

  const handleStartEditStage = (stage: Stage) => {
    setEditingStageId(stage.id);
    setEditingStageName(stage.name);
  };

  const handleSaveStage = async (stageId: string) => {
    if (!editingStageName.trim()) {
      toast({
        title: 'Error',
        description: 'Stage name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('job_stages')
        .update({ name: editingStageName })
        .eq('id', stageId);

      if (error) throw error;

      toast({
        title: 'Stage updated',
        description: 'Stage name has been updated successfully',
      });

      setEditingStageId(null);
      setEditingStageName('');
      fetchPipelineData();
    } catch (error: any) {
      toast({
        title: 'Error updating stage',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingStageId(null);
    setEditingStageName('');
  };

  const handleToggleSelect = (id: string) => {
    setSelectedApplicationIds((prev) =>
      prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
    );
  };

  const handleBulkStageChange = async (newStageId: string) => {
    if (selectedApplicationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ current_stage_id: newStageId })
        .in('id', selectedApplicationIds);

      if (error) throw error;

      toast({
        title: 'Applications moved',
        description: `Successfully moved ${selectedApplicationIds.length} candidate${selectedApplicationIds.length !== 1 ? 's' : ''} to new stage`,
      });

      setSelectedApplicationIds([]);
      fetchPipelineData();
    } catch (error: any) {
      toast({
        title: 'Error moving applications',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkReject = async (reason: string, note: string) => {
    if (selectedApplicationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          state: 'rejected',
          rejection_reason: reason,
          rejection_note: note
        })
        .in('id', selectedApplicationIds);

      if (error) throw error;

      toast({
        title: 'Applications rejected',
        description: `Successfully rejected ${selectedApplicationIds.length} candidate${selectedApplicationIds.length !== 1 ? 's' : ''}`,
      });

      setSelectedApplicationIds([]);
      setShowBulkRejectDialog(false);
      fetchPipelineData();
    } catch (error: any) {
      toast({
        title: 'Error rejecting applications',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const activeApplication = applications.find((app) => app.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasMovePermission && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have view-only access to this pipeline. Contact your administrator to request move permissions.
          </AlertDescription>
        </Alert>
      )}
      
      {selectedApplicationIds.length > 0 && hasMovePermission && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-medium">
                  {selectedApplicationIds.length} candidate{selectedApplicationIds.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplicationIds([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button>Move to Stage</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Select stage</p>
                      {stages.map((stage, index) => (
                        <Button
                          key={stage.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleBulkStageChange(stage.id)}
                        >
                          <div className={`w-2 h-2 rounded-full ${getStageColor(index)} mr-2`} />
                          {stage.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowBulkRejectDialog(true)}
                >
                  Reject Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scroll container with drag-to-scroll */}
        <div 
          ref={scrollContainerRef}
          className={`overflow-x-auto pb-4 ${isScrolling ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex gap-6 min-w-max">
            {stages.map((stage, index) => {
              const stageApplications = getApplicationsForStage(stage.id);
              const stageColor = getStageColor(index);
              
              return (
                <div
                  key={stage.id}
                  className="w-[320px] flex-shrink-0"
                >
                  <SortableContext
                    id={stage.id}
                    items={stageApplications.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableStage 
                      id={stage.id} 
                      isOver={overId === stage.id}
                      stage={stage}
                      stageColor={stageColor}
                      candidateCount={stageApplications.length}
                      onEditStage={() => handleStartEditStage(stage)}
                      isEditing={editingStageId === stage.id}
                      editingStageName={editingStageName}
                      onEditingNameChange={setEditingStageName}
                      onSaveStage={() => handleSaveStage(stage.id)}
                      onCancelEdit={handleCancelEdit}
                    >
                      {stageApplications.map((app) => (
                        <SortableApplication
                          key={app.id}
                          application={app}
                          onClick={() => navigate(`/applications/${app.id}`)}
                          isSelected={selectedApplicationIds.includes(app.id)}
                          onToggleSelect={handleToggleSelect}
                        />
                      ))}
                      {stageApplications.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-xs text-muted-foreground">Drop candidates here</p>
                        </div>
                      )}
                    </DroppableStage>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeApplication && (
            <Card className="shadow-lg rotate-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeApplication.candidate.avatar_url || undefined} />
                    <AvatarFallback>
                      {activeApplication.candidate.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activeApplication.candidate.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeApplication.candidate.location || 'Location not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No active applications for this job yet
            </p>
          </CardContent>
        </Card>
      )}

      <BulkRejectDialog
        open={showBulkRejectDialog}
        onOpenChange={setShowBulkRejectDialog}
        onConfirm={handleBulkReject}
        count={selectedApplicationIds.length}
      />
    </div>
  );
};

export default PipelineBoard;
