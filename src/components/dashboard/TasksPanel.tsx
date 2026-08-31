import React from 'react';

interface TaskItemProps {
  title: string;
  time: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ title, time }) => {
  return (
    <div className="bg-[rgba(69,206,153,0.1)] flex w-full items-center gap-3 p-2 rounded-lg">
      <div className="aspect-[1/1] self-stretch flex w-11 shrink-0 h-11 bg-[rgba(69,206,153,0.30)] my-auto rounded-md" />
      <div className="self-stretch flex-1 shrink basis-[0%] my-auto">
        <div className="text-black text-sm font-[590]">
          {title}
        </div>
        <div className="text-muted-foreground text-xs font-[510] mt-1">
          {time}
        </div>
      </div>
    </div>
  );
};

const TasksPanel = () => {
  const tasks = [
    { title: "Meeting", time: "Today • 12:30pm" },
    { title: "Complete Evaluation", time: "Tomorrow • 9:00am" },
    { title: "Meeting", time: "Today • 12:30pm" },
    { title: "Meeting", time: "Today • 12:30pm" },
    { title: "Meeting", time: "Today • 12:30pm" },
    { title: "Meeting", time: "Today • 12:30pm" },
    { title: "Meeting", time: "Today • 12:30pm" },
    { title: "Meeting", time: "Today • 12:30pm" }
  ];

  return (
    <section className="min-w-60 overflow-hidden w-[339px] bg-card rounded-xl">
      <div className="flex min-h-[50px] items-center gap-2.5 text-sm text-foreground font-[590] whitespace-nowrap px-4 py-[17px]">
        <h2 className="text-foreground self-stretch my-auto">
          Tasks
        </h2>
      </div>
      <div className="mx-4 max-md:mx-2.5 space-y-2">
        {tasks.map((task, index) => (
          <TaskItem
            key={index}
            title={task.title}
            time={task.time}
          />
        ))}
      </div>
    </section>
  );
};

export default TasksPanel;
