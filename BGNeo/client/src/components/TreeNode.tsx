import { useState, useCallback, useMemo } from 'react';

export interface TreeNodeData {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: TreeNodeData[];
  count?: number;
  badge?: string | number;
}

interface TreeNodeProps {
  node: TreeNodeData;
  level?: number;
  expandedKeys: Set<string | number>;
  onToggle: (key: string | number) => void;
  onSelect?: (node: TreeNodeData) => void;
  activeKey?: string | number;
  onClose?: () => void;
}

export default function TreeNode({
  node,
  level = 0,
  expandedKeys,
  onToggle,
  onSelect,
  activeKey,
  onClose,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.id);
  const isActive = activeKey === node.id;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node.id);
    },
    [node.id, onToggle]
  );

  const handleClick = useCallback(() => {
    if (node.href) {
      onSelect?.(node);
      onClose?.();
    } else if (hasChildren) {
      onToggle(node.id);
    }
  }, [hasChildren, node, onToggle, onSelect, onClose]);

  const renderChildren = useMemo(() => {
    if (!hasChildren || !isExpanded) return null;

    return (
      <ul className="tree-node-children" role="group">
        {node.children!.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
            onSelect={onSelect}
            activeKey={activeKey}
            onClose={onClose}
          />
        ))}
      </ul>
    );
  }, [hasChildren, isExpanded, node.children, level, expandedKeys, onToggle, onSelect, activeKey, onClose]);

  return (
    <li className={`tree-node ${isActive ? 'tree-node-active' : ''}`} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className="tree-node-content"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {hasChildren && (
          <span
            className={`tree-node-arrow ${isExpanded ? 'expanded' : ''}`}
            onClick={handleToggle}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        )}
        {!hasChildren && <span className="tree-node-indent" />}
        {node.icon && <span className="tree-node-icon">{node.icon}</span>}
        <span className="tree-node-label">{node.label}</span>
        {(node.count !== undefined || node.badge !== undefined) && (
          <span className="tree-node-badge">{node.badge ?? node.count}</span>
        )}
      </div>
      {renderChildren}
    </li>
  );
}

export function useTreeExpansion(defaultExpandedKeys: (string | number)[] = []) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set(defaultExpandedKeys));

  const toggle = useCallback((key: string | number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((nodes: TreeNodeData[]) => {
    const keys: (string | number)[] = [];
    const collect = (items: TreeNodeData[]) => {
      items.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.push(node.id);
          collect(node.children);
        }
      });
    };
    collect(nodes);
    setExpandedKeys(new Set(keys));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedKeys(new Set());
  }, []);

  return { expandedKeys, toggle, expandAll, collapseAll, setExpandedKeys };
}
