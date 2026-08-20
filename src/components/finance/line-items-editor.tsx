"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { calculateLineTotal, formatCurrency } from "@/types/finance";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
}

export function LineItemsEditor({ items, onChange, disabled }: LineItemsEditorProps) {
  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      tax_rate: 0,
      line_total: 0,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.line_total = calculateLineTotal(
          updated.quantity,
          updated.unit_price,
          updated.discount_amount,
          updated.tax_rate
        );
        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const itemDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0);
  const itemTax = items.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unit_price - item.discount_amount;
    return sum + lineSubtotal * (item.tax_rate / 100);
  }, 0);
  const total = items.reduce((sum, item) => sum + item.line_total, 0);

  return (
    <div className="space-y-3">
      <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_100px_100px_80px_110px_40px] gap-2 text-xs font-medium text-muted-foreground">
        <span>Description</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span>Discount</span>
        <span>Tax %</span>
        <span>Line Total</span>
        <span className="text-right">Amount</span>
        <span></span>
      </div>

      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_100px_80px_110px_40px] gap-2 items-center">
          <input
            type="text"
            placeholder="Description"
            value={item.description}
            onChange={(e) => updateItem(item.id, "description", e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
            disabled={disabled}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unit_price}
            onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.discount_amount}
            onChange={(e) => updateItem(item.id, "discount_amount", parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={item.tax_rate}
            onChange={(e) => updateItem(item.id, "tax_rate", parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <span className="text-sm text-muted-foreground hidden sm:block">{item.quantity} × {item.unit_price}</span>
          <span className="text-sm font-medium text-right hidden sm:block">{formatCurrency(item.line_total)}</span>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Item
        </Button>
      )}

      {items.length > 0 && (
        <div className="flex justify-end border-t pt-3 mt-3">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(itemDiscount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(itemTax)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
