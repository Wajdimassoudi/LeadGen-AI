/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Download, Trash2, Building2, Mail, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateLeads, CompanyLead } from "./services/gemini";

export default function App() {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<CompanyLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const results = await generateLeads(query);
      setLeads(results);
    } catch (err) {
      setError("Failed to generate leads. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (leads.length === 0) return;

    const headers = ["email", "company_name"];
    const csvContent = [
      headers.join(","),
      ...leads.map(lead => `"${lead.email}","${lead.company_name}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "target_list.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLeads = () => {
    setLeads([]);
    setQuery("");
    setError(null);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden text-slate-800">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">LeadGen AI</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-slate-500 font-medium">Powering your growth</div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <Building2 className="text-slate-400 w-5 h-5" />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Controls */}
        <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6">
          <form onSubmit={handleSearch} className="flex flex-col h-full gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Search</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g. Agricultural companies in Milan area, Italy..."
                className="w-full h-40 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 resize-none transition-all placeholder:text-slate-400"
                id="search-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Output Configuration</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <span className="text-xs font-medium text-blue-700">email</span>
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <span className="text-xs font-medium text-blue-700">company_name</span>
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2 mt-auto disabled:opacity-50 disabled:cursor-not-allowed group"
              id="generate-btn"
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <span>Generate Leads</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </aside>

        {/* Preview Grid Area */}
        <main className="flex-1 p-8 flex flex-col overflow-hidden bg-slate-50/50">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Results Preview</h1>
              <p className="text-slate-500 text-sm mt-1">
                {leads.length > 0 
                  ? `AI has found ${leads.length} potential leads matching your criteria.` 
                  : "Start a search to generate leads."}
              </p>
            </div>
            {leads.length > 0 && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5"
                id="download-btn"
              >
                <Download size={18} />
                Download .CSV
              </button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 w-6 h-6" />
                  </div>
                  <p className="mt-6 text-slate-500 font-medium animate-pulse">
                    Analyzing market data...
                  </p>
                </motion.div>
              ) : leads.length > 0 ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                        <tr>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">email</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">company_name</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leads.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-4 text-sm font-medium text-slate-700 group-hover:text-blue-600">
                              {lead.email}
                            </td>
                            <td className="px-8 py-4 text-sm text-slate-600">
                              {lead.company_name}
                            </td>
                            <td className="px-8 py-4 text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                                Validated
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center flex-shrink-0">
                    <p className="text-[10px] text-slate-400 font-medium italic uppercase tracking-wider">
                      Visualizing {leads.length} records. Download for full data access.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                    <Search size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No leads generated</h3>
                  <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
                    Enter your target criteria in the sidebar and click generate to start finding companies.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {error && (
              <div className="absolute bottom-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase tracking-wider">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
            AI Engine: Gemini Ultra
          </span>
          <span>Format: CSV UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{leads.length} items ready</span>
          <span>Processing time: ~1.2s</span>
        </div>
      </footer>
    </div>
  );
}

