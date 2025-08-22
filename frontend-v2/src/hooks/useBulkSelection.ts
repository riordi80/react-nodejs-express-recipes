import { useState, useMemo } from 'react';

interface UseBulkSelectionProps<T> {
  items: T[];
  getItemId: (item: T) => string;
}

export function useBulkSelection<T>({ items, getItemId }: UseBulkSelectionProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;
  const hasSelection = selectedIds.size > 0;

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(items.map(getItemId));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectItems = (itemIds: string[]) => {
    setSelectedIds(new Set(itemIds));
  };

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isIndeterminate,
    hasSelection,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    selectItems
  };
}