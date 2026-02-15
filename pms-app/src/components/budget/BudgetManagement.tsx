"use client";

import React, { useState } from "react";
import { BudgetItem, BudgetCategory } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  ProgressBar,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  PieChart,
  AlertTriangle,
} from "lucide-react";

interface BudgetManagementProps {
  budgetItems: BudgetItem[];
  totalBudget: number;
  onAddItem: (item: Omit<BudgetItem, "id" | "createdAt" | "updatedAt" | "projectId">) => void;
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => void;
}

const categoryOptions = [
  { value: "labor", label: "Labor" },
  { value: "materials", label: "Materials" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software" },
  { value: "travel", label: "Travel" },
  { value: "other", label: "Other" },
];

const categoryColors: Record<string, string> = {
  labor: "bg-blue-500",
  materials: "bg-green-500",
  equipment: "bg-yellow-500",
  software: "bg-purple-500",
  travel: "bg-orange-500",
  other: "bg-gray-500",
};

export function BudgetManagement({
  budgetItems,
  totalBudget,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: BudgetManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Calculate totals
  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actual, 0);
  const variance = totalPlanned - totalActual;
  const budgetUtilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // Group by category
  const categoryTotals = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { planned: 0, actual: 0 };
    }
    acc[item.category].planned += item.planned;
    acc[item.category].actual += item.actual;
    return acc;
  }, {} as Record<string, { planned: number; actual: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Budget Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track project costs and expenses
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Budget Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalBudget)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <PieChart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Planned</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalPlanned)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${budgetUtilization > 80 ? "bg-yellow-100" : "bg-purple-100"}`}>
              <TrendingUp className={`w-5 h-5 ${budgetUtilization > 80 ? "text-yellow-600" : "text-purple-600"}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actual Spent</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalActual)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${variance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              {variance >= 0 ? (
                <TrendingDown className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Variance</p>
              <p className={`text-xl font-bold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
            <span className={`text-sm font-medium ${budgetUtilization > 100 ? "text-red-600" : "text-gray-600"}`}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={Math.min(budgetUtilization, 100)} size="lg" />
          {budgetUtilization > 100 && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Budget exceeded by {formatCurrency(totalActual - totalBudget)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryTotals).map(([category, totals]) => {
                const utilization = totals.planned > 0 ? (totals.actual / totals.planned) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${categoryColors[category]}`} />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(totals.actual)} / {formatCurrency(totals.planned)}
                      </div>
                    </div>
                    <ProgressBar value={Math.min(utilization, 100)} size="sm" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Items List */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Budget Items</h3>
        </CardHeader>
        <CardContent>
          {budgetItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Planned</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actual</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Variance</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetItems.map((item) => {
                    const itemVariance = item.planned - item.actual;
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {item.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            <span className={`w-2 h-2 rounded-full ${categoryColors[item.category]}`} />
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.planned)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.actual)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${itemVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {itemVariance >= 0 ? "+" : ""}{formatCurrency(itemVariance)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<DollarSign className="w-12 h-12" />}
              title="No budget items"
              description="Add budget items to track project expenses"
              action={
                <Button onClick={() => setIsFormOpen(true)}>Add Budget Item</Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Budget Item Form Modal */}
      <BudgetItemForm
        isOpen={isFormOpen || !!editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={(data) => {
          if (editingItem) {
            onUpdateItem(editingItem.id, data);
          } else {
            onAddItem(data);
          }
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        existingItem={editingItem || undefined}
      />
    </div>
  );
}

interface BudgetItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<BudgetItem, "id" | "createdAt" | "updatedAt" | "projectId">) => void;
  existingItem?: BudgetItem;
}

function BudgetItemForm({
  isOpen,
  onClose,
  onSubmit,
  existingItem,
}: BudgetItemFormProps) {
  const [formData, setFormData] = useState({
    name: existingItem?.name || "",
    category: existingItem?.category || "labor",
    planned: existingItem?.planned?.toString() || "",
    actual: existingItem?.actual?.toString() || "0",
    notes: existingItem?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.planned || parseFloat(formData.planned) < 0) {
      newErrors.planned = "Valid planned amount is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: formData.name,
      category: formData.category as BudgetCategory,
      planned: parseFloat(formData.planned),
      actual: parseFloat(formData.actual) || 0,
      notes: formData.notes || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingItem ? "Edit Budget Item" : "Add Budget Item"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., Developer Salary"
          required
        />

        <Select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Planned Amount ($)"
            name="planned"
            type="number"
            value={formData.planned}
            onChange={handleChange}
            error={errors.planned}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />

          <Input
            label="Actual Amount ($)"
            name="actual"
            type="number"
            value={formData.actual}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <Textarea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {existingItem ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BudgetManagement;
