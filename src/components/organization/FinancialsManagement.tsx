import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Users,
  FlaskConical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";

interface TrialFinancial {
  id: string;
  name: string;
  phase: string;
  status: string;
  budget_data: any;
  patient_count: number;
}

export function FinancialsManagement() {
  const [trialsFinancial, setTrialsFinancial] = useState<TrialFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const { organizationId } = useAppData();

  useEffect(() => {
    if (organizationId) {
      loadFinancialData();
    }
  }, [organizationId]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Get trials with budget data and patient counts
      const { data: trials, error } = await supabase
        .from("trials")
        .select(
          `
          id,
          name,
          phase,
          status,
          budget_data,
          trial_patients!inner(count)
        `
        )
        .eq("organization_id", organizationId);

      if (error) throw error;

      // Transform data to include patient counts
      const trialsWithCounts = await Promise.all(
        (trials || []).map(async (trial) => {
          const { count } = await supabase
            .from("trial_patients")
            .select("*", { count: "exact", head: true })
            .eq("trial_id", trial.id);

          return {
            ...trial,
            patient_count: count || 0,
          };
        })
      );

      setTrialsFinancial(trialsWithCounts);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate organization totals
  const organizationTotals = trialsFinancial.reduce(
    (acc, trial) => {
      const budgetData = trial.budget_data || {};
      const totalBudget = budgetData.total_budget || 0;
      const spentToDate = budgetData.spent_to_date || 0;
      const monthlyBurn = budgetData.burn_rate || 0;

      return {
        totalBudget: acc.totalBudget + totalBudget,
        totalSpent: acc.totalSpent + spentToDate,
        totalMonthlyBurn: acc.totalMonthlyBurn + monthlyBurn,
        totalPatients: acc.totalPatients + trial.patient_count,
      };
    },
    { totalBudget: 0, totalSpent: 0, totalMonthlyBurn: 0, totalPatients: 0 }
  );

  const overallUtilization =
    organizationTotals.totalBudget > 0
      ? (organizationTotals.totalSpent / organizationTotals.totalBudget) * 100
      : 0;

  const avgCostPerPatient =
    organizationTotals.totalPatients > 0
      ? organizationTotals.totalSpent / organizationTotals.totalPatients
      : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetAlertLevel = (utilization: number) => {
    if (utilization >= 90) return "critical";
    if (utilization >= 75) return "warning";
    return "ok";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
        <p className="text-gray-600">
          Budget analysis and cost management across all trials
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 mb-1">Total Budget</dt>
              <dd className="text-2xl font-bold text-gray-900">
                {formatCurrency(organizationTotals.totalBudget)}
              </dd>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 mb-1">Total Spent</dt>
              <dd className="text-2xl font-bold text-gray-900">
                {formatCurrency(organizationTotals.totalSpent)}
              </dd>
              <div className="text-xs text-gray-500">
                {overallUtilization.toFixed(1)}% utilized
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 mb-1">Monthly Burn</dt>
              <dd className="text-2xl font-bold text-gray-900">
                {formatCurrency(organizationTotals.totalMonthlyBurn)}
              </dd>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">
                Avg Cost/Patient
              </dt>
              <dd className="text-2xl font-bold text-gray-900">
                {formatCurrency(avgCostPerPatient)}
              </dd>
              <div className="text-xs text-gray-500">
                {organizationTotals.totalPatients} total patients
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Budget Utilization
        </h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>
              {formatCurrency(organizationTotals.totalSpent)} /{" "}
              {formatCurrency(organizationTotals.totalBudget)}
            </span>
          </div>
          <Progress value={overallUtilization} className="h-3" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-blue-600">
              {formatCurrency(
                organizationTotals.totalBudget - organizationTotals.totalSpent
              )}
            </div>
            <div className="text-gray-500">Remaining</div>
          </div>
          <div>
            <div className="font-medium text-blue-600">
              {trialsFinancial.length}
            </div>
            <div className="text-gray-500">Active Trials</div>
          </div>
          <div>
            <div className="font-medium text-blue-600">
              {organizationTotals.totalMonthlyBurn > 0
                ? Math.round(
                    (organizationTotals.totalBudget -
                      organizationTotals.totalSpent) /
                      organizationTotals.totalMonthlyBurn
                  )
                : 0}
            </div>
            <div className="text-gray-500">Months Left</div>
          </div>
        </div>
      </Card>

      {/* Trials Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trial Financial Summary
        </h3>
        <div className="space-y-4">
          {trialsFinancial.map((trial) => {
            const budgetData = trial.budget_data || {};
            const totalBudget = budgetData.total_budget || 0;
            const spentToDate = budgetData.spent_to_date || 0;
            const utilization =
              totalBudget > 0 ? (spentToDate / totalBudget) * 100 : 0;
            const alertLevel = getBudgetAlertLevel(utilization);

            return (
              <div
                key={trial.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {trial.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{trial.phase}</Badge>
                        <span>•</span>
                        <span>{trial.patient_count} patients</span>
                      </div>
                    </div>
                  </div>
                  {alertLevel !== "ok" && (
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        alertLevel === "critical"
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Progress</span>
                    <span>
                      {formatCurrency(spentToDate)} /{" "}
                      {formatCurrency(totalBudget)} ({utilization.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress
                    value={utilization}
                    className={`h-2 ${
                      alertLevel === "critical"
                        ? "[&>div]:bg-red-500"
                        : alertLevel === "warning"
                        ? "[&>div]:bg-blue-500"
                        : ""
                    }`}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Remaining: {formatCurrency(totalBudget - spentToDate)}
                    </span>
                    <span>
                      Burn: {formatCurrency(budgetData.burn_rate || 0)}/month
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}