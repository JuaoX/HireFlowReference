import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { EditTaskDialog } from "./EditTaskDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  label: string | null;
  due_date: string | null;
  status: "pending" | "completed";
  created_at: string;
}

interface TasksListProps {
  tasks: Task[];
  onTasksChange: () => void;
}

export function TasksList({ tasks, onTasksChange }: TasksListProps) {
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      toast.error("Failed to update task status");
      console.error(error);
      return;
    }

    toast.success(`Task marked as ${newStatus}`);
    onTasksChange();
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;

    const { error } = await supabase.from("tasks").delete().eq("id", deleteTaskId);

    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
      return;
    }

    toast.success("Task deleted successfully");
    setDeleteTaskId(null);
    onTasksChange();
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No tasks yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="">{task.title}</h4>
                    {task.label && (
                      <Badge variant="outline" className="text-xs">
                        {task.label}
                      </Badge>
                    )}
                    <Badge
                      variant={task.status === "completed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                  </div>
                  {task.due_date && (
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(task.due_date), "PPp")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(task)}
                    title={
                      task.status === "pending" ? "Mark as completed" : "Mark as pending"
                    }
                  >
                    {task.status === "pending" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditTask(task)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTaskId(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          onTaskUpdated={onTasksChange}
        />
      )}

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
