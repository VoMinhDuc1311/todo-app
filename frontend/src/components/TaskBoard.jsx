import React, { useState, useEffect, useCallback } from "react";
import socket from "../config/socket";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
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
  } = useSortable({ id: task._id, data: { task, type: "task" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`cursor-grab active:cursor-grabbing w-full mb-2.5 last:mb-0 transition-opacity ${isDragging ? "z-50" : ""}`}
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
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });

  return (
    <div
      ref={setNodeRef}
      className={`bg-[#f4f5f7] rounded-lg p-3 flex flex-col w-full min-h-[600px] transition-colors duration-200 border-2 ${
        isOver ? "border-blue-400 bg-blue-50/50" : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bold text-[#5e6c84] text-xs uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[10px] bg-[#ebecf0] text-[#42526e] font-bold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext id={id} items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 w-full flex flex-col min-h-[50px]">
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
          {/* Empty state visual for empty columns */}
          {tasks.length === 0 && (
            <div className={`h-16 rounded-md border-2 border-dashed flex items-center justify-center transition-opacity ${isOver ? "opacity-100 border-blue-300" : "opacity-0"}`}>
               <span className="text-xs text-blue-400 font-medium">Drop here</span>
            </div>
          )}
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
    todo:        { title: "Todo",          items: tasks.filter(t => t.status === "todo") },
    in_progress: { title: "In Progress",   items: tasks.filter(t => t.status === "in_progress") },
    done:        { title: "Done",          items: tasks.filter(t => t.status === "done") },
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

  const handleDragStart = (e) => {
    setActiveId(e.active.id);
  };

  // Custom collision detection to prioritize columns
  const customCollisionDetection = (args) => {
    // First, check pointerWithin
    const collisions = pointerWithin(args);
    
    // If we have a collision with a column, prioritize it
    const columnCollision = collisions.find((c) => c.data?.droppableHandler?.data?.type === 'column');
    if (columnCollision) return [columnCollision];
    
    // Fallback logic
    return collisions;
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    console.log("Dropped to:", overId); // Debug log

    let newStatus = null;
    
    // 1. Check if overId is directly a column key
    if (Object.keys(columns).includes(overId)) {
      newStatus = overId;
    } 
    // 2. Check if overId is a task, then get its column
    else {
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        // 3. Last resort: check the data attribute of the droppable
        const overData = over.data?.current;
        if (overData?.type === "column") {
           newStatus = overId;
        } else if (overData?.task) {
           newStatus = overData.task.status;
        }
      }
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
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full pb-8">
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
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="opacity-100 scale-105 shadow-xl rotate-2 rounded-lg cursor-grabbing pointer-events-none w-full max-w-[350px]">
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