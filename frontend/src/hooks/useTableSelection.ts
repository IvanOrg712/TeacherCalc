import { useState, useCallback } from 'react';

export interface CellPosition {
    row: number;
    col: number;
}

export interface UseTableSelectionOptions {
    totalRows: number;
    totalCols: number;
    isSelectable?: (row: number, col: number) => boolean;
}

export interface UseTableSelectionReturn {
    selectedCells: Set<string>;
    handleCellMouseDown: (row: number, col: number, event: React.MouseEvent) => void;
    handleCellMouseEnter: (row: number, col: number) => void;
    handleMouseUp: () => void;
    handleRowSelect: (row: number) => void;
    handleColumnSelect: (col: number) => void;
    clearSelection: () => void;
    isSelected: (row: number, col: number) => boolean;
}

const cellKey = (row: number, col: number): string => `${row}-${col}`;

export const useTableSelection = ({
    totalRows,
    totalCols,
    isSelectable = () => true
}: UseTableSelectionOptions): UseTableSelectionReturn => {
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<CellPosition | null>(null);

    // Helper to get all cells in a rectangular range
    const getCellsInRange = useCallback((start: CellPosition, end: CellPosition): Set<string> => {
        const cells = new Set<string>();
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (isSelectable(r, c)) {
                    cells.add(cellKey(r, c));
                }
            }
        }
        return cells;
    }, [isSelectable]);

    // Handle mouse down on a cell - start selection or toggle with shift
    const handleCellMouseDown = useCallback((row: number, col: number, event: React.MouseEvent) => {
        if (!isSelectable(row, col)) return;

        const key = cellKey(row, col);

        if (event.shiftKey) {
            // Shift+click: toggle this cell
            setSelectedCells(prev => {
                const next = new Set(prev);
                if (next.has(key)) {
                    next.delete(key);
                } else {
                    next.add(key);
                }
                return next;
            });
        } else {
            // Normal click: start new selection
            setIsDragging(true);
            setDragStart({ row, col });
            setSelectedCells(new Set([key]));
        }
    }, [isSelectable]);

    // Handle mouse enter during drag - extend selection
    const handleCellMouseEnter = useCallback((row: number, col: number) => {
        if (!isDragging || !dragStart) return;

        const cells = getCellsInRange(dragStart, { row, col });
        setSelectedCells(cells);
    }, [isDragging, dragStart, getCellsInRange]);

    // Handle mouse up - end drag
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Select entire row
    const handleRowSelect = useCallback((row: number) => {
        const cells = new Set<string>();
        for (let c = 0; c < totalCols; c++) {
            if (isSelectable(row, c)) {
                cells.add(cellKey(row, c));
            }
        }
        setSelectedCells(cells);
    }, [totalCols, isSelectable]);

    // Select entire column
    const handleColumnSelect = useCallback((col: number) => {
        const cells = new Set<string>();
        for (let r = 0; r < totalRows; r++) {
            if (isSelectable(r, col)) {
                cells.add(cellKey(r, col));
            }
        }
        setSelectedCells(cells);
    }, [totalRows, isSelectable]);

    // Clear all selection
    const clearSelection = useCallback(() => {
        setSelectedCells(new Set());
        setIsDragging(false);
        setDragStart(null);
    }, []);

    // Check if a cell is selected
    const isSelected = useCallback((row: number, col: number): boolean => {
        return selectedCells.has(cellKey(row, col));
    }, [selectedCells]);

    return {
        selectedCells,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleMouseUp,
        handleRowSelect,
        handleColumnSelect,
        clearSelection,
        isSelected
    };
};
