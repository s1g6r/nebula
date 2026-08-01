import { useEffect, useMemo, useRef } from 'react';
import * as d3force from 'd3-force';
import type { Note } from '../lib/db';
import { buildLinkGraph } from '../lib/wikilinks';

interface GraphNode extends d3force.SimulationNodeDatum {
  id: string;
  title: string;
  isDaily: boolean;
  degree: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphViewProps {
  notes: Note[];
  onSelect: (id: string) => void;
  isDark: boolean;
}

export function GraphView({ notes, onSelect, isDark }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const hoveredRef = useRef<GraphNode | null>(null);
  const draggingRef = useRef<GraphNode | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const simRef = useRef<d3force.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);

  const { forwardLinks } = useMemo(() => buildLinkGraph(notes), [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const degree = new Map<string, number>();
    const links: GraphLink[] = [];
    for (const [id, targets] of forwardLinks) {
      for (const t of targets) {
        links.push({ source: id, target: t });
        degree.set(id, (degree.get(id) ?? 0) + 1);
        degree.set(t, (degree.get(t) ?? 0) + 1);
      }
    }
    const nodes: GraphNode[] = notes.map((n) => ({
      id: n.id,
      title: n.title,
      isDaily: n.isDaily,
      degree: degree.get(n.id) ?? 0,
    }));
    nodesRef.current = nodes;
    linksRef.current = links;

    let width = container.clientWidth;
    let height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas || !container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    resize();

    const ctx = canvas.getContext('2d')!;

    const simulation = d3force
      .forceSimulation(nodes)
      .force(
        'link',
        d3force
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(90)
          .strength(0.5),
      )
      .force('charge', d3force.forceManyBody().strength(-260))
      .force('center', d3force.forceCenter(width / 2, height / 2))
      .force('collide', d3force.forceCollide<GraphNode>().radius((d) => nodeRadius(d) + 14));

    simRef.current = simulation;

    function nodeRadius(d: GraphNode) {
      return 6 + Math.min(d.degree, 8) * 1.6;
    }

    function draw() {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = isDark ? '#0b0e1a' : '#fafafa';
      ctx.fillRect(0, 0, width, height);

      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      const hovered = hoveredRef.current;
      const connected = new Set<string>();
      if (hovered) {
        connected.add(hovered.id);
        for (const l of links) {
          const s = typeof l.source === 'string' ? l.source : l.source.id;
          const tg = typeof l.target === 'string' ? l.target : l.target.id;
          if (s === hovered.id) connected.add(tg);
          if (tg === hovered.id) connected.add(s);
        }
      }

      // Edges
      ctx.lineWidth = 1 / t.k;
      for (const l of links) {
        const s = l.source as GraphNode;
        const tg = l.target as GraphNode;
        if (typeof s.x !== 'number' || typeof tg.x !== 'number') continue;
        const dim = hovered && !(connected.has(s.id) && connected.has(tg.id));
        ctx.strokeStyle = dim
          ? isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)'
          : isDark
            ? 'rgba(167,139,250,0.35)'
            : 'rgba(124,58,237,0.3)';
        ctx.beginPath();
        ctx.moveTo(s.x!, s.y!);
        ctx.lineTo(tg.x!, tg.y!);
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
        const r = nodeRadius(n);
        const dim = hovered && !connected.has(n.id);
        const isHovered = hovered?.id === n.id;

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        if (n.isDaily) {
          ctx.fillStyle = dim ? (isDark ? 'rgba(96,165,250,0.25)' : 'rgba(96,165,250,0.3)') : '#60a5fa';
        } else {
          ctx.fillStyle = dim ? (isDark ? 'rgba(167,139,250,0.25)' : 'rgba(139,92,246,0.3)') : '#8b5cf6';
        }
        ctx.fill();
        if (isHovered) {
          ctx.lineWidth = 2 / t.k;
          ctx.strokeStyle = isDark ? '#fff' : '#000';
          ctx.stroke();
        }

        if (t.k > 0.55 || isHovered) {
          ctx.font = `${isHovered ? 'bold ' : ''}${12 / t.k}px -apple-system, sans-serif`;
          ctx.fillStyle = dim
            ? isDark
              ? 'rgba(255,255,255,0.25)'
              : 'rgba(0,0,0,0.25)'
            : isDark
              ? 'rgba(255,255,255,0.85)'
              : 'rgba(0,0,0,0.8)';
          ctx.textAlign = 'center';
          ctx.fillText(n.title, n.x, n.y + r + 14 / t.k);
        }
      }

      ctx.restore();
    }

    simulation.on('tick', draw);
    draw();

    function toSimCoords(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const t = transformRef.current;
      const x = (clientX - rect.left - t.x) / t.k;
      const y = (clientY - rect.top - t.y) / t.k;
      return { x, y };
    }

    function findNodeAt(x: number, y: number): GraphNode | null {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
        const r = nodeRadius(n) + 4;
        const dx = n.x - x;
        const dy = n.y - y;
        if (dx * dx + dy * dy <= r * r) return n;
      }
      return null;
    }

    let didDrag = false;

    function onPointerDown(e: PointerEvent) {
      const { x, y } = toSimCoords(e.clientX, e.clientY);
      const node = findNodeAt(x, y);
      didDrag = false;
      if (node) {
        draggingRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
        simulation.alphaTarget(0.3).restart();
      } else {
        panningRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          origX: transformRef.current.x,
          origY: transformRef.current.y,
        };
      }
      canvas!.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (draggingRef.current) {
        didDrag = true;
        const { x, y } = toSimCoords(e.clientX, e.clientY);
        draggingRef.current.fx = x;
        draggingRef.current.fy = y;
        draw();
      } else if (panningRef.current) {
        didDrag = true;
        const p = panningRef.current;
        transformRef.current.x = p.origX + (e.clientX - p.startX);
        transformRef.current.y = p.origY + (e.clientY - p.startY);
        draw();
      } else {
        const { x, y } = toSimCoords(e.clientX, e.clientY);
        const node = findNodeAt(x, y);
        if (hoveredRef.current?.id !== node?.id) {
          hoveredRef.current = node;
          canvas!.style.cursor = node ? 'pointer' : 'grab';
          draw();
        }
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (draggingRef.current) {
        const node = draggingRef.current;
        node.fx = null;
        node.fy = null;
        simulation.alphaTarget(0);
        draggingRef.current = null;
        if (!didDrag) onSelect(node.id);
      }
      panningRef.current = null;
      canvas!.releasePointerCapture(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const t = transformRef.current;
      const scale = Math.exp(-e.deltaY * 0.001);
      const newK = Math.min(4, Math.max(0.2, t.k * scale));
      t.x = mx - ((mx - t.x) / t.k) * newK;
      t.y = my - ((my - t.y) / t.k) * newK;
      t.k = newK;
      draw();
    }

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      resize();
      simulation.force('center', d3force.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    });
    ro.observe(container);

    return () => {
      simulation.stop();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      ro.disconnect();
    };
  }, [notes, forwardLinks, isDark, onSelect]);

  return (
    <div ref={containerRef} className="flex-1 h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          Create a few notes and link them with [[wikilinks]] to see your graph.
        </div>
      )}
      <div className="absolute bottom-3 left-3 text-[11px] text-gray-400 bg-white/70 dark:bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md pointer-events-none">
        Drag nodes • Scroll to zoom • Drag background to pan
      </div>
    </div>
  );
}
