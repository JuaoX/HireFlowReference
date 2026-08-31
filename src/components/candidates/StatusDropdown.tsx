import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getStageColorClasses } from '@/lib/stage-colors';

interface StatusDropdownProps {
  currentStage: {
    id: string;
    name: string;
    type: string;
  } | null;
  applicationId: string;
  applicationState?: 'active' | 'rejected' | 'withdrawn' | 'hired';
  availableStages: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  onStageChange?: () => Promise<void> | void;
}

export const StatusDropdown = ({
  currentStage,
  applicationId,
  applicationState = 'active',
  availableStages,
  onStageChange,
}: StatusDropdownProps) => {
  const [updating, setUpdating] = useState(false);
  const [optimisticStageId, setOptimisticStageId] = useState<string | null>(currentStage?.id ?? null);

  useEffect(() => {
    setOptimisticStageId(currentStage?.id ?? null);
  }, [currentStage?.id]);

  const stageById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: string }>();
    availableStages.forEach((s) => map.set(s.id, s));
    return map;
  }, [availableStages]);

  const displayedStage = optimisticStageId ? stageById.get(optimisticStageId) ?? currentStage : currentStage;
  
  // Show application state if not active, otherwise show stage name
  const getDisplayName = () => {
    if (applicationState === 'withdrawn') return 'Withdrawn';
    if (applicationState === 'rejected') return 'Rejected';
    return displayedStage?.name || 'No Stage';
  };
  
  const displayedStageName = getDisplayName();
  
  // Disable dropdown if application is withdrawn or rejected
  const isDisabled = updating || applicationState === 'withdrawn' || applicationState === 'rejected';

  const handleStageChange = async (stageId: string) => {
    // Don't update if selecting the same stage
    if ((optimisticStageId ?? currentStage?.id) === stageId) return;

    const previousStageId = optimisticStageId ?? currentStage?.id ?? null;
    setOptimisticStageId(stageId);

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ current_stage_id: stageId })
        .eq('id', applicationId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Status update was blocked (no rows updated). Check your permissions for this job.');
      }

      // Refresh parent data (authoritative state)
      if (onStageChange) {
        await onStageChange();
      }

      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    } catch (error: any) {
      // Revert optimistic UI on failure
      setOptimisticStageId(previousStageId);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isDisabled}>
        <div
          className={cn(
            'w-[184px] px-3 py-2 rounded-md inline-flex justify-center items-center gap-1 cursor-pointer transition-all border',
            'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
            getStageColorClasses(displayedStageName)
          )}
          aria-label="Change candidate status"
        >
          <div className="flex-1 text-center text-base font-medium">{displayedStageName}</div>
          <ChevronDown className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background z-50">
        {availableStages.map((stage) => (
          <DropdownMenuItem
            key={stage.id}
            onClick={() => handleStageChange(stage.id)}
            className="cursor-pointer"
          >
            <Badge
              variant="outline"
              className={cn('capitalize w-full justify-center border', getStageColorClasses(stage.name))}
            >
              {stage.name}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
