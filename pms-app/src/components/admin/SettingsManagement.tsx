"use client";

import React, { useState } from "react";
import { useAdminStore } from "@/lib/adminStore";
import {
  Entity,
  Department,
  Category,
  Application,
  Integration,
} from "@/lib/types";
import {
  Building2,
  Briefcase,
  Tag,
  AppWindow,
  Link2,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Settings,
  ChevronRight,
} from "lucide-react";

type SettingTab = "entities" | "departments" | "categories" | "applications" | "integrations";

const tabConfig = {
  entities: { label: "Entities", icon: Building2, color: "blue" },
  departments: { label: "Departments", icon: Briefcase, color: "green" },
  categories: { label: "Categories", icon: Tag, color: "purple" },
  applications: { label: "Applications", icon: AppWindow, color: "orange" },
  integrations: { label: "Integrations", icon: Link2, color: "cyan" },
};

export function SettingsManagement() {
  const {
    entities,
    departments,
    categories,
    applications,
    integrations,
    addEntity,
    updateEntity,
    deleteEntity,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addCategory,
    updateCategory,
    deleteCategory,
    addApplication,
    updateApplication,
    deleteApplication,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    checkPermission,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<SettingTab>("entities");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const canEdit = checkPermission("admin:all") || checkPermission(`${activeTab}:write` as any);

  const getFilteredItems = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case "entities":
        return entities.filter((e) => e.name.toLowerCase().includes(term));
      case "departments":
        return departments.filter((d) => d.name.toLowerCase().includes(term));
      case "categories":
        return categories.filter((c) => c.name.toLowerCase().includes(term));
      case "applications":
        return applications.filter((a) => a.name.toLowerCase().includes(term));
      case "integrations":
        return integrations.filter((i) => i.name.toLowerCase().includes(term));
      default:
        return [];
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    switch (activeTab) {
      case "entities":
        deleteEntity(id);
        break;
      case "departments":
        deleteDepartment(id);
        break;
      case "categories":
        deleteCategory(id);
        break;
      case "applications":
        deleteApplication(id);
        break;
      case "integrations":
        deleteIntegration(id);
        break;
    }
  };

  const handleSave = (data: any) => {
    if (editingItem) {
      switch (activeTab) {
        case "entities":
          updateEntity(editingItem.id, data);
          break;
        case "departments":
          updateDepartment(editingItem.id, data);
          break;
        case "categories":
          updateCategory(editingItem.id, data);
          break;
        case "applications":
          updateApplication(editingItem.id, data);
          break;
        case "integrations":
          updateIntegration(editingItem.id, data);
          break;
      }
    } else {
      switch (activeTab) {
        case "entities":
          addEntity(data);
          break;
        case "departments":
          addDepartment(data);
          break;
        case "categories":
          addCategory(data);
          break;
        case "applications":
          addApplication(data);
          break;
        case "integrations":
          addIntegration(data);
          break;
      }
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const items = getFilteredItems();
  const TabIcon = tabConfig[activeTab].icon;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">
              Configure entities, departments, categories, and more
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-4">
          {(Object.keys(tabConfig) as SettingTab[]).map((tab) => {
            const config = tabConfig[tab];
            const Icon = config.icon;
            const count =
              tab === "entities"
                ? entities.length
                : tab === "departments"
                ? departments.length
                : tab === "categories"
                ? categories.length
                : tab === "applications"
                ? applications.length
                : integrations.length;

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchTerm("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
                <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Actions */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${tabConfig[activeTab].label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {canEdit && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {tabConfig[activeTab].label.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <TabIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No {tabConfig[activeTab].label.toLowerCase()} found</p>
            <p className="text-sm">
              {searchTerm ? "Try a different search term" : "Add your first item to get started"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Name
                  </th>
                  {activeTab === "departments" && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      Entity
                    </th>
                  )}
                  {activeTab === "categories" && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      Color
                    </th>
                  )}
                  {activeTab === "applications" && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      Vendor
                    </th>
                  )}
                  {activeTab === "integrations" && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      Type
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  {canEdit && (
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {activeTab === "categories" && (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.code && (
                            <p className="text-xs text-gray-500">{item.code}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {activeTab === "departments" && (
                      <td className="px-4 py-3 text-gray-600">
                        {item.entityId
                          ? entities.find((e) => e.id === item.entityId)?.name || "-"
                          : "-"}
                      </td>
                    )}
                    {activeTab === "categories" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-gray-500">{item.color}</span>
                        </div>
                      </td>
                    )}
                    {activeTab === "applications" && (
                      <td className="px-4 py-3 text-gray-600">{item.vendor || "-"}</td>
                    )}
                    {activeTab === "integrations" && (
                      <td className="px-4 py-3 text-gray-600">{item.type || "-"}</td>
                    )}
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {item.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <SettingsModal
          type={activeTab}
          item={editingItem}
          entities={entities}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Settings Modal Component
function SettingsModal({
  type,
  item,
  entities,
  onClose,
  onSave,
}: {
  type: SettingTab;
  item: any;
  entities: Entity[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    code: item?.code || "",
    description: item?.description || "",
    color: item?.color || "#6B7280",
    entityId: item?.entityId || "",
    vendor: item?.vendor || "",
    type: item?.type || "",
    isActive: item?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const title = item
    ? `Edit ${tabConfig[type].label.slice(0, -1)}`
    : `Add ${tabConfig[type].label.slice(0, -1)}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(type === "entities" || type === "departments" || type === "categories") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Optional short code"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === "departments" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity
              </label>
              <select
                value={formData.entityId}
                onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Entity</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "categories" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {type === "applications" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Oracle, Microsoft"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === "integrations" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="API">API</option>
                <option value="File Transfer">File Transfer</option>
                <option value="Database">Database</option>
                <option value="Webhook">Webhook</option>
                <option value="Message Queue">Message Queue</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {item ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
