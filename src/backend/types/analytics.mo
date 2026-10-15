import Common "common";

module {
  public type ClientId = Common.ClientId;
  public type EngagementId = Common.EngagementId;
  public type Timestamp = Common.Timestamp;

  public type DashboardSummary = {
    totalRevenue : Nat;
    totalCost : Nat;
    grossMargin : Int;
    billableHours : Nat;
    totalHours : Nat;
    utilizationPercent : Nat;
  };

  public type ProfitabilityRow = {
    id : Nat;
    name : Text;
    revenue : Nat;
    cost : Nat;
    margin : Int;
    marginPercent : Int;
  };

  public type MonthlyTrendPoint = {
    year : Nat;
    month : Nat;
    hours : Nat;
    revenue : Nat;
  };

  public type UnbilledSummary = {
    unbilledHours : Nat;
    unbilledValue : Nat;
    entryCount : Nat;
  };
};
