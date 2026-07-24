'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import type { Widget as WidgetModel } from '@querydash/types';

const ReactGridLayout = WidthProvider(GridLayout);

export interface WidgetLayoutUpdate {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardGridProps {
  widgets: WidgetModel[];
  editing?: boolean;
  /** Fires once when a drag or resize gesture settles (not on every intermediate frame), so callers can persist without spamming the API. */
  onLayoutSettled?: (layout: WidgetLayoutUpdate[]) => void;
  renderWidget: (widget: WidgetModel) => ReactNode;
}

function toUpdates(layout: Layout[]): WidgetLayoutUpdate[] {
  return layout.map((item) => ({ id: item.i, x: item.x, y: item.y, w: item.w, h: item.h }));
}

export function DashboardGrid({ widgets, editing = false, onLayoutSettled, renderWidget }: DashboardGridProps) {
  const layout: Layout[] = useMemo(
    () => widgets.map((w) => ({ i: w.id, x: w.options.x, y: w.options.y, w: w.options.w, h: w.options.h })),
    [widgets]
  );

  return (
    <ReactGridLayout
      className="qd-root"
      layout={layout}
      cols={12}
      rowHeight={30}
      margin={[12, 12]}
      isDraggable={editing}
      isResizable={editing}
      draggableHandle=".qd-widget-drag-handle"
      onDragStop={(next) => onLayoutSettled?.(toUpdates(next))}
      onResizeStop={(next) => onLayoutSettled?.(toUpdates(next))}
    >
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className="overflow-hidden rounded-qd-md border border-qd-neutral-200 bg-white shadow-qd-card"
        >
          {renderWidget(widget)}
        </div>
      ))}
    </ReactGridLayout>
  );
}
