import React, { useState, useEffect, useCallback } from "react";
import socket from "../config/socket";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

// Draggable Task Item Wrapper
function SortableTaskItem({ task, currentUserId, onEdit, onDelete, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="cursor-grab active:cursor-grabbing w-full mb-3 last:mb-0"
    >
      <TaskCard
        task={task}
        currentUserId={currentUserId}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
      />
    </div>
  );
}

// Droppable Column
function Column({ id, title, tasks, currentUserId, onEdit, onDelete, onToggle }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100/60 backdrop-blur-sm rounded-3xl p-4 flex flex-col w-full min-h-[500px] border transition-all duration-200 ${
        isOver ? "border-indigo-400 bg-indigo-50/70 shadow-inner" : "border-slate-200 shadow-sm"
      }`}
    >
      <h3 className="font-extrabold text-slate-700 tracking-wide mb-5 px-2 flex justify-between items-center text-[15px]">
        {title}
        <span className="text-[11px] bg-white text-slate-600 px-2.5 py-1 rounded-xl shadow-sm border border-slate-100">
          {tasks.length}
        </span>
      </h3>

      <SortableContext id={id} items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 w-full flex flex-col">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task._id}
              task={task}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// Main Board Component
export default function TaskBoard({ tasks, currentUserId, onStatusChange, onEdit, onDelete, onToggle }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const columns = {
    todo:        { title: "⭕ To Do",      items: tasks.filter(t => t.status === "todo") },
    in_progress: { title: "🔵 In Progress", items: tasks.filter(t => t.status === "in_progress") },
    done:        { title: "✅ Done",        items: tasks.filter(t => t.status === "done") },
  };

  // ─── Lắng nghe event từ các client khác ───────────────────────────────────
  const handleRemoteStatusChange = useCallback(({ taskId, newStatus }) => {
    if (onStatusChange) onStatusChange(taskId, newStatus);
  }, [onStatusChange]);

  useEffect(() => {
    socket.on("task:statusChanged", handleRemoteStatusChange);
    return () => {
      socket.off("task:statusChanged", handleRemoteStatusChange);
    };
  }, [handleRemoteStatusChange]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleDragStart = (e) => {
    setActiveId(e.active.id);
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    let newStatus = null;
    if (Object.keys(columns).includes(overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) newStatus = overTask.status;
    }

    const activeTask = tasks.find(t => t._id === taskId);
    if (!activeTask || !newStatus || activeTask.status === newStatus) return;

    // Optimistic update
    if (onStatusChange) onStatusChange(taskId, newStatus);

    // Emit cho các client khác
    socket.emit("task:statusChanged", { taskId, newStatus });
  };

  const activeTask = tasks.find(t => t._id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in w-full">
        {Object.entries(columns).map(([id, col]) => (
          <Column
            key={id}
            id={id}
            title={col.title}
            tasks={col.items}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Ghost element while dragging */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 scale-105 shadow-2xl rounded-2xl cursor-grabbing pointer-events-none w-full">
            <TaskCard
              task={activeTask}
              currentUserId={currentUserId}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggle={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}