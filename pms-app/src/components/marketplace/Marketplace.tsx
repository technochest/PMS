"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/adminStore";
import {
  Mail,
  Building2,
  Receipt,
  Users,
  TrendingUp,
  Cloud,
  Search,
  Check,
  ExternalLink,
  Settings,
  Plus,
  ChevronRight,
  Zap,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Key,
  Lock,
} from "lucide-react";

// Integration categories
type IntegrationCategory = "email" | "erp" | "billing" | "payroll" | "investments" | "cloud";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: string;
  color: string;
  connected: boolean;
  accounts?: number;
  popular?: boolean;
}

const categories: { id: IntegrationCategory; name: string; icon: React.ReactNode; description: string }[] = [
  { id: "email", name: "Email", icon: <Mail className="w-5 h-5" />, description: "Connect your email accounts" },
  { id: "erp", name: "ERP Systems", icon: <Building2 className="w-5 h-5" />, description: "Enterprise resource planning" },
  { id: "billing", name: "Billing & AP", icon: <Receipt className="w-5 h-5" />, description: "Billing and accounts payable" },
  { id: "payroll", name: "Payroll & HR", icon: <Users className="w-5 h-5" />, description: "Payroll and HR management" },
  { id: "investments", name: "Investments", icon: <TrendingUp className="w-5 h-5" />, description: "Investment platforms" },
  { id: "cloud", name: "Cloud Storage", icon: <Cloud className="w-5 h-5" />, description: "Cloud file storage" },
];

const integrations: Integration[] = [
  // Email providers
  { id: "outlook", name: "Microsoft Outlook", description: "Connect multiple Microsoft 365 and Outlook email accounts", category: "email", icon: "📧", color: "bg-blue-500", connected: false, popular: true },
  { id: "gmail", name: "Gmail", description: "Connect multiple Google Workspace and Gmail accounts", category: "email", icon: "📨", color: "bg-red-500", connected: false, popular: true },
  { id: "hotmail", name: "Hotmail / Live", description: "Connect Hotmail and Microsoft Live accounts", category: "email", icon: "✉️", color: "bg-cyan-500", connected: false },
  { id: "yahoo", name: "Yahoo Mail", description: "Connect Yahoo Mail accounts", category: "email", icon: "📬", color: "bg-purple-500", connected: false },
  { id: "imap", name: "IMAP/SMTP", description: "Connect any email via IMAP/SMTP protocols", category: "email", icon: "🔗", color: "bg-gray-500", connected: false },
  
  // ERP Systems
  { id: "netsuite", name: "NetSuite", description: "Oracle NetSuite ERP integration for financials, inventory, and CRM", category: "erp", icon: "🏢", color: "bg-orange-500", connected: false, popular: true },
  { id: "sap", name: "SAP", description: "SAP S/4HANA and Business One integration", category: "erp", icon: "🔷", color: "bg-blue-600", connected: false, popular: true },
  { id: "sage", name: "Sage", description: "Sage Intacct, 50, 100, 200, and X3 solutions", category: "erp", icon: "🌿", color: "bg-green-500", connected: false },
  { id: "dynamics", name: "Microsoft Dynamics", description: "Dynamics 365 Business Central and Finance", category: "erp", icon: "💼", color: "bg-purple-600", connected: false },
  { id: "quickbooks", name: "QuickBooks", description: "QuickBooks Online and Desktop integration", category: "erp", icon: "📗", color: "bg-green-600", connected: false, popular: true },
  { id: "xero", name: "Xero", description: "Xero accounting and bookkeeping platform", category: "erp", icon: "📊", color: "bg-sky-500", connected: false },
  { id: "odoo", name: "Odoo", description: "Open source ERP and business apps", category: "erp", icon: "🟣", color: "bg-violet-500", connected: false },
  
  // Billing Systems
  { id: "tipalti", name: "Tipalti", description: "Global payables automation platform", category: "billing", icon: "💳", color: "bg-indigo-500", connected: false, popular: true },
  { id: "billcom", name: "Bill.com", description: "Accounts payable and receivable automation", category: "billing", icon: "📄", color: "bg-emerald-500", connected: false, popular: true },
  { id: "stripe", name: "Stripe", description: "Payment processing and billing management", category: "billing", icon: "💰", color: "bg-violet-600", connected: false },
  { id: "coupa", name: "Coupa", description: "Procurement and spend management", category: "billing", icon: "🛒", color: "bg-blue-400", connected: false },
  { id: "ariba", name: "SAP Ariba", description: "Procurement and supply chain solutions", category: "billing", icon: "🔄", color: "bg-amber-500", connected: false },
  { id: "melio", name: "Melio", description: "B2B payments platform", category: "billing", icon: "📋", color: "bg-teal-500", connected: false },
  { id: "brex", name: "Brex", description: "Corporate cards and spend management", category: "billing", icon: "🎯", color: "bg-orange-600", connected: false },
  
  // Payroll
  { id: "justworks", name: "Justworks", description: "PEO, payroll, benefits, and HR in one", category: "payroll", icon: "👥", color: "bg-pink-500", connected: false, popular: true },
  { id: "workday", name: "Workday", description: "Human capital and financial management", category: "payroll", icon: "☀️", color: "bg-amber-600", connected: false, popular: true },
  { id: "adp", name: "ADP", description: "Payroll, HR, time, and benefits administration", category: "payroll", icon: "🔴", color: "bg-red-600", connected: false, popular: true },
  { id: "gusto", name: "Gusto", description: "Payroll, benefits, and HR platform", category: "payroll", icon: "🧡", color: "bg-orange-400", connected: false },
  { id: "paychex", name: "Paychex", description: "Payroll, HR, and benefits solutions", category: "payroll", icon: "📅", color: "bg-blue-700", connected: false },
  { id: "bamboohr", name: "BambooHR", description: "HR software for small and medium businesses", category: "payroll", icon: "🎍", color: "bg-green-400", connected: false },
  { id: "rippling", name: "Rippling", description: "HR, IT, and finance in one platform", category: "payroll", icon: "💫", color: "bg-yellow-500", connected: false },
  { id: "paylocity", name: "Paylocity", description: "Cloud-based payroll and HCM solution", category: "payroll", icon: "📊", color: "bg-indigo-600", connected: false },
  
  // Investments
  { id: "schwab", name: "Charles Schwab", description: "Investment accounts and portfolio tracking", category: "investments", icon: "📈", color: "bg-sky-600", connected: false, popular: true },
  { id: "fidelity", name: "Fidelity", description: "Investment and retirement accounts", category: "investments", icon: "🏛️", color: "bg-green-700", connected: false },
  { id: "vanguard", name: "Vanguard", description: "Investment management services", category: "investments", icon: "⛵", color: "bg-red-700", connected: false },
  { id: "etrade", name: "E*TRADE", description: "Online brokerage and trading", category: "investments", icon: "💹", color: "bg-purple-500", connected: false },
  { id: "merrill", name: "Merrill Lynch", description: "Wealth management and investments", category: "investments", icon: "🦅", color: "bg-blue-800", connected: false },
  { id: "robinhood", name: "Robinhood", description: "Commission-free trading", category: "investments", icon: "🪶", color: "bg-emerald-600", connected: false },
  
  // Cloud Storage
  { id: "gdrive", name: "Google Drive", description: "Connect Google Drive for document storage and sharing", category: "cloud", icon: "📁", color: "bg-yellow-500", connected: false, popular: true },
  { id: "onedrive", name: "OneDrive", description: "Microsoft OneDrive personal and business accounts", category: "cloud", icon: "☁️", color: "bg-blue-500", connected: false, popular: true },
  { id: "dropbox", name: "Dropbox", description: "Dropbox file sync and sharing", category: "cloud", icon: "📦", color: "bg-blue-600", connected: false, popular: true },
  { id: "box", name: "Box", description: "Enterprise content management and collaboration", category: "cloud", icon: "📥", color: "bg-sky-500", connected: false },
  { id: "sharepoint", name: "SharePoint", description: "Microsoft SharePoint document libraries", category: "cloud", icon: "🗂️", color: "bg-teal-600", connected: false },
  { id: "s3", name: "Amazon S3", description: "AWS S3 bucket integration", category: "cloud", icon: "🪣", color: "bg-orange-600", connected: false },
];

// Connected account type from API
interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  displayName: string | null;
  lastSyncAt: string | null;
  isActive: boolean;
  emailCount: number;
}

export function Marketplace() {
  const { currentUser } = useAdminStore();
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState<"oauth" | "direct">("oauth");
  const [directLoginEmail, setDirectLoginEmail] = useState("");
  const [directLoginPassword, setDirectLoginPassword] = useState("");
  const [directLoginError, setDirectLoginError] = useState<string | null>(null);

  // Fetch connected accounts on mount
  const fetchConnectedAccounts = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`/api/emails/accounts?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch connected accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchConnectedAccounts();
  }, [fetchConnectedAccounts]);

  // Handle OAuth callback parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const email = params.get("email");

    if (success === "outlook_connected" && email) {
      setNotification({ type: "success", message: `Successfully connected ${email}` });
      fetchConnectedAccounts();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_code_or_state: "OAuth flow was interrupted",
        invalid_state: "Invalid OAuth state",
        oauth_not_configured: "OAuth is not configured. Please set up Azure AD credentials.",
        token_exchange_failed: "Failed to exchange OAuth token",
        profile_fetch_failed: "Failed to fetch user profile",
        connection_failed: "Failed to connect account",
      };
      setNotification({
        type: "error",
        message: errorMessages[error] || `Connection failed: ${error}`,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchConnectedAccounts]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Get connected integration IDs based on connected accounts
  const connectedIntegrationIds = new Set(
    connectedAccounts.map((a) => a.provider === "outlook" ? "outlook" : a.provider)
  );

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    const matchesSearch = 
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
    setConnectMode("oauth");
    setDirectLoginEmail("");
    setDirectLoginPassword("");
    setDirectLoginError(null);
  };

  const handleDirectLogin = async () => {
    if (!selectedIntegration || !currentUser?.id) return;
    if (!directLoginEmail || !directLoginPassword) {
      setDirectLoginError("Please enter both email and password");
      return;
    }

    setConnectingId(selectedIntegration.id);
    setDirectLoginError(null);

    try {
      const response = await fetch("/api/auth/imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: directLoginEmail,
          password: directLoginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDirectLoginError(data.message || "Connection failed");
        if (data.suggestions) {
          setDirectLoginError(
            data.message + "\n\nSuggestions:\n• " + data.suggestions.join("\n• ")
          );
        }
      } else if (data.success) {
        setNotification({ type: "success", message: "Account connected successfully!" });
        setShowConnectModal(false);
        fetchConnectedAccounts();
      }
    } catch (error) {
      setDirectLoginError("Failed to connect. Please try again.");
    } finally {
      setConnectingId(null);
    }
  };

  const handleConfirmConnect = () => {
    if (!selectedIntegration || !currentUser?.id) return;

    // If using direct login mode, use that handler
    if (connectMode === "direct" && selectedIntegration.category === "email") {
      handleDirectLogin();
      return;
    }

    // For Outlook, use real OAuth flow
    if (selectedIntegration.id === "outlook") {
      setConnectingId(selectedIntegration.id);
      // Redirect to OAuth endpoint
      window.location.href = `/api/auth/outlook?userId=${currentUser.id}`;
      return;
    }

    // For other integrations, show "coming soon" or simulate
    setConnectingId(selectedIntegration.id);
    setTimeout(() => {
      setNotification({
        type: "success",
        message: `${selectedIntegration.name} integration coming soon!`,
      });
      setConnectingId(null);
      setShowConnectModal(false);
      setSelectedIntegration(null);
    }, 1000);
  };

  const handleDisconnect = async (integrationId: string, accountId?: string) => {
    if (!currentUser?.id) return;

    // For Outlook, use real API to disconnect
    if (integrationId === "outlook" && accountId) {
      try {
        const response = await fetch(
          `/api/emails/accounts?accountId=${accountId}&userId=${currentUser.id}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          setNotification({ type: "success", message: "Account disconnected successfully" });
          fetchConnectedAccounts();
        } else {
          setNotification({ type: "error", message: "Failed to disconnect account" });
        }
      } catch (error) {
        setNotification({ type: "error", message: "Failed to disconnect account" });
      }
      return;
    }
  };

  const handleSyncEmails = async (accountId: string) => {
    if (!currentUser?.id) return;

    setSyncingAccountId(accountId);
    try {
      const response = await fetch("/api/emails/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, userId: currentUser.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotification({
          type: "success",
          message: `Synced ${data.synced} emails successfully`,
        });
        fetchConnectedAccounts();
      } else {
        const error = await response.json();
        setNotification({
          type: "error",
          message: error.error || "Failed to sync emails",
        });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed to sync emails" });
    } finally {
      setSyncingAccountId(null);
    }
  };

  const connectedCount = connectedAccounts.length;
  const popularIntegrations = integrations.filter(i => i.popular);

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      {/* Notification Banner */}
      {notification && (
        <div
          className={cn(
            "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top",
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Integration Marketplace</h1>
            <p className="text-white/80 text-lg">
              Connect your favorite apps and services to streamline your workflow
            </p>
            
            {/* Stats */}
            <div className="flex gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-white/70 text-sm">Available Integrations</p>
                <p className="text-2xl font-bold text-white">{integrations.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-white/70 text-sm">Connected</p>
                <p className="text-2xl font-bold text-white">{connectedCount}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-white/70 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Connected Accounts Section */}
            {connectedAccounts.length > 0 && selectedCategory === "all" && searchTerm === "" && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Your Connected Accounts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-white rounded-xl border border-green-200 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-lg">
                            📧
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {account.displayName || account.email}
                            </p>
                            <p className="text-sm text-gray-500">{account.email}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        <p>{account.emailCount} emails synced</p>
                        {account.lastSyncAt && (
                          <p>
                            Last sync: {new Date(account.lastSyncAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSyncEmails(account.id)}
                          disabled={syncingAccountId === account.id}
                          className={cn(
                            "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1",
                            syncingAccountId === account.id
                              ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          {syncingAccountId === account.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Sync Now
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDisconnect("outlook", account.id)}
                          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Integrations */}
            {selectedCategory === "all" && searchTerm === "" && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Popular Integrations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {popularIntegrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      isConnected={connectedIntegrationIds.has(integration.id)}
                      isConnecting={connectingId === integration.id}
                      onConnect={() => handleConnect(integration)}
                      onDisconnect={() => handleDisconnect(integration.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category Sections or Filtered Results */}
            {selectedCategory === "all" && searchTerm === "" ? (
              categories.map((category) => (
                <div key={category.id} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {category.icon}
                    {category.name}
                    <span className="text-sm font-normal text-gray-500">
                      — {category.description}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {integrations
                      .filter((i) => i.category === category.id)
                      .map((integration) => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          isConnected={connectedIntegrationIds.has(integration.id)}
                          isConnecting={connectingId === integration.id}
                          onConnect={() => handleConnect(integration)}
                          onDisconnect={() => handleDisconnect(integration.id)}
                        />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    isConnected={connectedIntegrationIds.has(integration.id)}
                    isConnecting={connectingId === integration.id}
                    onConnect={() => handleConnect(integration)}
                    onDisconnect={() => handleDisconnect(integration.id)}
                  />
                ))}
              </div>
            )}

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No integrations found</p>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className={cn("h-2", selectedIntegration.color)} />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
                  selectedIntegration.color
                )}>
                  {selectedIntegration.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedIntegration.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedIntegration.description}</p>
                </div>
              </div>

              {/* Tabs for email integrations */}
              {selectedIntegration.category === "email" && (
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setConnectMode("oauth")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      connectMode === "oauth"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    OAuth (Recommended)
                  </button>
                  <button
                    onClick={() => setConnectMode("direct")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      connectMode === "direct"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Key className="w-4 h-4" />
                    Direct Login
                  </button>
                </div>
              )}

              {/* OAuth mode content */}
              {connectMode === "oauth" && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Secure Connection</p>
                      <p className="text-sm text-gray-500">OAuth 2.0 encrypted authentication</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Real-time Sync</p>
                      <p className="text-sm text-gray-500">Data syncs automatically in both directions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Plus className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Multiple Accounts</p>
                      <p className="text-sm text-gray-500">Connect multiple accounts per integration</p>
                    </div>
                  </div>
                  {selectedIntegration.category === "email" && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">Requires Admin Approval</p>
                        <p className="text-sm text-amber-700">Corporate accounts may need IT admin to register this app in Azure AD</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Direct Login mode content */}
              {connectMode === "direct" && selectedIntegration.category === "email" && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Direct IMAP Login</p>
                      <p className="text-sm text-blue-700">Sign in with your email credentials like you would in Outlook</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={directLoginEmail}
                        onChange={(e) => setDirectLoginEmail(e.target.value)}
                        placeholder="junaid.buchal@mdlz.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={directLoginPassword}
                        onChange={(e) => setDirectLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {directLoginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 whitespace-pre-line">{directLoginError}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900">Note for Corporate Accounts</p>
                      <p className="text-sm text-amber-700">Most organizations disable IMAP login for security. If this doesn&apos;t work, use the &quot;Import Emails&quot; feature instead.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedIntegration(null);
                    setDirectLoginError(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConnect}
                  disabled={connectingId !== null}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2",
                    connectingId
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  )}
                >
                  {connectingId ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : connectMode === "direct" && selectedIntegration.category === "email" ? (
                    <>
                      <Key className="w-4 h-4" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Connect with OAuth
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Integration Card Component
function IntegrationCard({
  integration,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className={cn(
      "bg-white rounded-xl border p-4 transition-all hover:shadow-lg group",
      isConnected ? "border-green-300 ring-1 ring-green-200" : "border-gray-200 hover:border-indigo-300"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110",
          integration.color
        )}>
          {integration.icon}
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Connected
          </span>
        )}
        {integration.popular && !isConnected && (
          <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
            Popular
          </span>
        )}
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{integration.description}</p>
      
      {isConnected ? (
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
            <Settings className="w-4 h-4" />
            Configure
          </button>
          <button
            onClick={onDisconnect}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className={cn(
            "w-full px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            isConnecting
              ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
          )}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Connect
            </>
          )}
        </button>
      )}
    </div>
  );
}
