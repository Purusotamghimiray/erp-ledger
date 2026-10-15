import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AnalyticsLib "../lib/analytics";
import Types "../types/analytics";

mixin (state : AnalyticsLib.State) {
  func requireSignedInAnalytics(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Sign-in required");
    };
  };

  public query ({ caller }) func getDashboardSummary() : async Types.DashboardSummary {
    requireSignedInAnalytics(caller);
    AnalyticsLib.dashboard(state, caller);
  };

  public query ({ caller }) func getClientProfitability() : async [Types.ProfitabilityRow] {
    requireSignedInAnalytics(caller);
    AnalyticsLib.clientProfitability(state, caller);
  };

  public query ({ caller }) func getEngagementProfitability() : async [Types.ProfitabilityRow] {
    requireSignedInAnalytics(caller);
    AnalyticsLib.engagementProfitability(state, caller);
  };

  public query ({ caller }) func getMonthlyTrend(months : Nat) : async [Types.MonthlyTrendPoint] {
    requireSignedInAnalytics(caller);
    AnalyticsLib.monthlyTrend(state, caller, months);
  };

  public query ({ caller }) func getUnbilledSummary() : async Types.UnbilledSummary {
    requireSignedInAnalytics(caller);
    AnalyticsLib.unbilledSummary(state, caller);
  };
};
