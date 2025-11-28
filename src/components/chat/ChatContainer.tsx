import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChatHistory } from "./ChatHistory";
import { ChatArea } from "./ChatArea";
import { ChatInput } from "./ChatInput";
import { ArtifactRenderer } from "./ArtifactRenderer";
import { useAppData } from "@/hooks/useAppData";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Groq } from "groq-sdk";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage, ChatSession } from "./types";

interface ChatContainerProps {
  organizationId: string | null;
  stats: any;
}

export function ChatContainer({ organizationId, stats }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    sessions,
    createSessionWithMessage,
    addMessageAsync,
    deleteSession,
    getSessionMessages,
  } = useChatHistory();

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setIsLoading(true);

    // Create new session if this is the first message
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const { sessionId: newSessionId } = await createSessionWithMessage(userMessage);
        sessionId = newSessionId;
        setCurrentSessionId(newSessionId);
      } catch (error) {
        console.error("Failed to create session:", error);
        setIsLoading(false);
        return;
      }
    } else {
      // Save user message to existing session
      try {
        await addMessageAsync({
          sessionId,
          role: "user",
          content: userMessage,
        });
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    }

    // Add user message to UI
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage, timestamp: new Date() },
    ];
    setMessages(newMessages);

    try {
      // Get real trial data and financial data
      const { data: trials, error: trialsError } = await supabase
        .from("trials")
        .select(
          `
          id,
          name,
          phase,
          status,
          budget_data
        `
        )
        .eq("organization_id", organizationId);

      let contextData = `Organization ID: ${organizationId}
- Total Trials: ${stats?.totalTrials || 0}
- Total Members: ${stats?.totalMembers || 0}
- Total Patients: ${stats?.totalPatients || 0}
- Pending Invitations: ${stats?.totalInvitations || 0}`;

      if (trials && trials.length > 0) {
        contextData += `\n\nTrial Details:`;
        let totalBudget = 0;
        let totalSpent = 0;

        for (const trial of trials) {
          const { data: trialPatients, count } = await supabase
            .from("trial_patients")
            .select("cost_data, patient_data")
            .eq("trial_id", trial.id);

          const budgetData = (trial.budget_data as Record<string, any>) || {};
          const budget = budgetData.total_budget || 0;
          const spent = budgetData.spent_to_date || 0;

          totalBudget += budget;
          totalSpent += spent;

          contextData += `\n- "${trial.name}" (Phase ${trial.phase}, Status: ${trial.status})`;
          contextData += `\n  * Patients: ${count || 0}`;
          contextData += `\n  * Budget: $${budget.toLocaleString()}`;
          contextData += `\n  * Spent: $${spent.toLocaleString()}`;
          contextData += `\n  * Remaining: $${(
            budget - spent
          ).toLocaleString()}`;

          // Add detailed patient data for agentic behavior
          if (trialPatients && trialPatients.length > 0) {
            contextData += `\n  * Patient Details:`;
            trialPatients.forEach((patient, index) => {
              const patientData =
                (patient.patient_data as Record<string, any>) || {};
              const costData = (patient.cost_data as Record<string, any>) || {};

              if (patientData.medical) {
                contextData += `\n    - Patient ${index + 1}: Age ${
                  patientData.medical.age || "N/A"
                }, Gender ${patientData.medical.gender || "N/A"}`;
              }
              if (patientData.visits) {
                contextData += `\n      Visits Overall: ${
                  patientData.visits.completed || 0
                }/${patientData.visits.total_target || 0} completed`;
                
                // EXPLICITLY add 6-month data
                if (patientData.visits.last_6_months) {
                  contextData += `\n      Last 6 Months: ${
                    patientData.visits.last_6_months.completed || 0
                  } completed, ${
                    patientData.visits.last_6_months.scheduled || 0
                  } scheduled, ${
                    patientData.visits.last_6_months.missed || 0
                  } missed`;
                  contextData += `\n      6-Month Attendance Rate: ${
                    patientData.visits.last_6_months.completed && patientData.visits.last_6_months.scheduled
                      ? ((patientData.visits.last_6_months.completed / patientData.visits.last_6_months.scheduled) * 100).toFixed(1)
                      : 0
                  }%`;
                }
              }
              if (patientData.compliance) {
                contextData += `\n      Compliance Score: ${
                  patientData.compliance.overallScore || "N/A"
                }%`;
              }
              
              // Add cost data for financial analysis
              if (costData && Object.keys(costData).length > 0) {
                contextData += `\n      Cost Information:`;
                if (costData.budget_allocated) {
                  contextData += `\n        Budget Allocated: $${costData.budget_allocated}`;
                }
                if (costData.costs_to_date) {
                  contextData += `\n        Costs to Date: $${costData.costs_to_date}`;
                }
                if (costData.transport_allowance) {
                  contextData += `\n        Transportation Allowance: $${costData.transport_allowance}`;
                }
                if (costData.reimbursement_rate) {
                  contextData += `\n        Reimbursement Rate: $${costData.reimbursement_rate}`;
                }
                if (costData.target_visits) {
                  contextData += `\n        Target Visits: ${costData.target_visits}`;
                }
              }
              if (patientData.nextVisit) {
                contextData += `\n      Next Visit: ${
                  patientData.nextVisit.date || "Not scheduled"
                }`;
              }
              
              // Add visit history for temporal analysis
              if (patientData.visitHistory && Array.isArray(patientData.visitHistory)) {
                contextData += `\n      Visit History Details:`;
                patientData.visitHistory.forEach((visit: any) => {
                  contextData += `\n        * ${visit.date} (${visit.month}): ${visit.type} - ${visit.status}`;
                });
                
                // Calculate last month data (assuming current month is August 2025)
                const lastMonthVisits = patientData.visitHistory.filter((v: any) => v.month === "2025-07");
                const lastMonthCompleted = lastMonthVisits.filter((v: any) => v.status === "completed").length;
                const lastMonthTotal = lastMonthVisits.length;
                
                if (lastMonthTotal > 0) {
                  contextData += `\n        Last Month (July 2025): ${lastMonthCompleted}/${lastMonthTotal} completed (${((lastMonthCompleted/lastMonthTotal)*100).toFixed(1)}%)`;
                }
              }
            });
          }
        }

        contextData += `\n\nOrganization Financial Summary:`;
        contextData += `\n- Total Budget: $${totalBudget.toLocaleString()}`;
        contextData += `\n- Total Spent: $${totalSpent.toLocaleString()}`;
        contextData += `\n- Total Remaining: $${(
          totalBudget - totalSpent
        ).toLocaleString()}`;
        contextData += `\n- Budget Utilization: ${
          totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0
        }%`;
      }

      const contextPrompt = `You are Assistant, an intelligent clinical trials assistant with access to real organization data:

${contextData}

CRITICAL CALCULATION GUIDELINES - READ CAREFULLY:
When analyzing visit data, you MUST distinguish between these metrics:
- "6-Month Attendance Rate" = last_6_months.completed / last_6_months.scheduled × 100
- "Overall Progress Rate" = visits.completed / visits.total_target × 100
- IMPORTANT: "scheduled" means total visits that were supposed to happen (not completed + remaining)
- When user asks for "last 6 months" data, use the last_6_months object values
- The contextData already includes pre-calculated 6-Month Attendance Rate - TRUST AND USE IT
- NEVER recalculate if pre-calculated values are provided - they are authoritative
- Always show your calculation formula and the actual numbers used

SMART VERBOSITY GUIDELINES:
Adapt your response detail level based on question type:
- SUMMARY questions (how many, what's the total, what's the rate): Provide CONCISE answers with key metrics only
- ANALYSIS questions (show patterns, compare, identify issues): Provide detailed breakdowns with individual data
- EXECUTIVE questions (business review, quarterly analysis): Lead with executive summary, then supporting details
- If >5 patients and asking for simple totals/counts: DON'T list individual patients unless specifically requested
- For simple metrics, format as: "Answer: X out of Y (Z% rate). Calculation: formula"
- Always prioritize the direct answer to the user's question first

For patient_data structure:
- visits.completed = total completed visits in trial
- visits.total_target = total planned visits for entire trial
- visits.last_6_months.completed = visits completed in last 6 months
- visits.last_6_months.scheduled = visits scheduled in last 6 months
- visitHistory = array of individual visits with dates and status
- CRITICAL: For monthly analysis, use visitHistory array to filter by month field
- Each visitHistory entry has: date, month, type, status, visit_number
- The contextData includes pre-calculated "Last Month" data - USE IT DIRECTLY
- For cost analysis, use the Cost Information section for each patient
- Transportation costs are in "Transportation Allowance" field per patient
- Compare costs across trial phases by grouping patients by their trial's phase

RESPONSE FORMAT GUIDELINES:
- For SIMPLE questions: Start with direct answer, then brief supporting details
- For COMPLEX analysis: Use structured format with headers and tables
- For EXECUTIVE queries: Executive summary first, then detailed analysis

You can use these formatting options:
- ## Headers for sections
- | Table | Format | With | Columns |
- - Bullet points for lists
- Regular conversational text

RESPONSE EXAMPLES:
Simple: "14 visits were scheduled last month, 1 was missed (92.9% completion rate). Calculation: 13 completed ÷ 14 scheduled = 92.9%"
Analysis: "## Visit Pattern Analysis\n[detailed breakdown with individual data]"
Executive: "## Executive Summary\nKey findings: [summary]\n## Detailed Analysis\n[supporting data]"

Always match your response style to the complexity and audience level of the question.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextPrompt },
          ...newMessages
            .slice(-5)
            .map((msg) => ({ role: msg.role, content: msg.content })), // Keep last 5 messages for context, strip extra properties
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_completion_tokens: 512,
        top_p: 1,
        stream: true,
      });

      let assistantResponse = "";

      // Add placeholder for assistant message
      setMessages([
        ...newMessages,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || "";
        assistantResponse += content;

        // Update the last message (assistant's response) in real-time
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: assistantResponse,
            hasArtifact: hasArtifactContent(assistantResponse),
            timestamp: new Date(),
          },
        ]);
      }

      // Save assistant's response to DB after streaming completes
      if (sessionId && assistantResponse) {
        try {
          await addMessageAsync({
            sessionId,
            role: "assistant",
            content: assistantResponse,
          });
        } catch (error) {
          console.error("Failed to save assistant response:", error);
        }
      }
    } catch (error) {
      console.error("Error with Groq chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasArtifactContent = (content: string): boolean => {
    // Check for structured data that benefits from ArtifactRenderer
    const hasHeaders = content.includes("##");
    const hasTables = content.includes("|") && content.includes("---");
    const hasBulletLists = content
      .split("\n")
      .some((line) => line.trim().startsWith("- "));

    return hasHeaders || hasTables || hasBulletLists;
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const sessionMessages = await getSessionMessages(sessionId);
      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error("Failed to load session messages:", error);
    }
  };

  return (
    <div className="flex flex-col w-full mt-8">
      <Card className="flex h-full min-h-[500px] max-h-[700px] overflow-hidden">
        {/* Chat History Sidebar - Only show if there are sessions */}
        {sessions.length > 0 && (
          <div
            className={`
            transition-all duration-300 ease-in-out border-r border-gray-200 bg-gray-50
            ${isHistoryOpen ? "w-80" : "w-0"}
            ${isHistoryOpen ? "opacity-100" : "opacity-0"}
            overflow-hidden flex-shrink-0
          `}
          >
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onDeleteSession={deleteSession}
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Only show history button if there are sessions */}
              {sessions.length > 0 && (
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Chat History"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      AI Assistant
                    </h3>
                    {currentSessionId && (
                      <p className="text-xs text-gray-600">
                        {sessions.find((s) => s.id === currentSessionId)
                          ?.title || "Untitled"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="New Chat"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            ArtifactRenderer={ArtifactRenderer}
          />

          {/* Input Box */}
          <ChatInput
            message={chatMessage}
            isLoading={isLoading}
            onMessageChange={setChatMessage}
            onSubmit={handleChatSubmit}
          />
        </div>
      </Card>
    </div>
  );
}
