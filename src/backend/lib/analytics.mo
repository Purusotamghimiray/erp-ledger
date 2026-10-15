import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import ClientTypes "../types/clients";
import TimeTypes "../types/time";
import Types "../types/analytics";

module {
  public type State = {
    clients : Map.Map<ClientTypes.ClientId, ClientTypes.Client>;
    engagements : Map.Map<ClientTypes.EngagementId, ClientTypes.Engagement>;
    entries : Map.Map<TimeTypes.TimeEntryId, TimeTypes.TimeEntry>;
  };

  // Cost for an entry: hours * costRate, regardless of billing model.
  func entryCost(engagement : ClientTypes.Engagement, entry : TimeTypes.TimeEntry) : Nat {
    entry.hours * engagement.costRate;
  };

  func marginPercent(revenue : Nat, cost : Nat) : Int {
    if (revenue == 0) { return 0 };
    let margin = revenue.toInt() - cost.toInt();
    (margin * 100) / revenue.toInt();
  };

  func isFixedFee(engagement : ClientTypes.Engagement) : Bool {
    switch (engagement.billingModel) {
      case (#fixedFee) { true };
      case (#hourly) { false };
    };
  };

  // Sum revenue/cost/hours for entries belonging to one engagement, applying the
  // fixed-fee rule: only the first billable entry contributes the fixed fee.
  func aggregateEngagement(
    engagement : ClientTypes.Engagement,
    entries : [TimeTypes.TimeEntry],
  ) : (Nat, Nat, Nat, Nat) {
    var revenue = 0;
    var cost = 0;
    var billableHours = 0;
    var totalHours = 0;
    var fixedFeeCounted = false;
    for (entry in entries.values()) {
      if (entry.engagementId == engagement.id) {
        totalHours += entry.hours;
        cost += entryCost(engagement, entry);
        if (entry.billable) {
          billableHours += entry.hours;
          if (isFixedFee(engagement)) {
            if (not fixedFeeCounted) {
              revenue += engagement.fixedFee ?? 0;
              fixedFeeCounted := true;
            };
          } else {
            revenue += entry.hours * engagement.billableRate;
          };
        };
      };
    };
    (revenue, cost, billableHours, totalHours);
  };

  func ownedEngagements(state : State, caller : Principal) : [ClientTypes.Engagement] {
    let result = List.empty<ClientTypes.Engagement>();
    for (engagement in state.engagements.values()) {
      if (Principal.equal(engagement.owner, caller)) {
        result.add(engagement);
      };
    };
    result.toArray();
  };

  func ownedEntries(state : State, caller : Principal) : [TimeTypes.TimeEntry] {
    let result = List.empty<TimeTypes.TimeEntry>();
    for (entry in state.entries.values()) {
      if (Principal.equal(entry.owner, caller)) {
        result.add(entry);
      };
    };
    result.toArray();
  };

  public func dashboard(state : State, caller : Principal) : Types.DashboardSummary {
    let engagements = ownedEngagements(state, caller);
    let entries = ownedEntries(state, caller);
    var totalRevenue = 0;
    var totalCost = 0;
    var billableHours = 0;
    var totalHours = 0;
    for (engagement in engagements.values()) {
      let (revenue, cost, billable, total) = aggregateEngagement(engagement, entries);
      totalRevenue += revenue;
      totalCost += cost;
      billableHours += billable;
      totalHours += total;
    };
    let utilizationPercent = if (totalHours == 0) { 0 } else {
      (billableHours * 100) / totalHours;
    };
    {
      totalRevenue;
      totalCost;
      grossMargin = totalRevenue.toInt() - totalCost.toInt();
      billableHours;
      totalHours;
      utilizationPercent;
    };
  };

  public func clientProfitability(state : State, caller : Principal) : [Types.ProfitabilityRow] {
    let engagements = ownedEngagements(state, caller);
    let entries = ownedEntries(state, caller);
    let rows = List.empty<Types.ProfitabilityRow>();
    for (client in state.clients.values()) {
      if (Principal.equal(client.owner, caller)) {
        var revenue = 0;
        var cost = 0;
        for (engagement in engagements.values()) {
          if (engagement.clientId == client.id) {
            let (r, c, _, _) = aggregateEngagement(engagement, entries);
            revenue += r;
            cost += c;
          };
        };
        rows.add({
          id = client.id;
          name = client.name;
          revenue;
          cost;
          margin = revenue.toInt() - cost.toInt();
          marginPercent = marginPercent(revenue, cost);
        });
      };
    };
    rows.toArray();
  };

  public func engagementProfitability(state : State, caller : Principal) : [Types.ProfitabilityRow] {
    let engagements = ownedEngagements(state, caller);
    let entries = ownedEntries(state, caller);
    let rows = List.empty<Types.ProfitabilityRow>();
    for (engagement in engagements.values()) {
      let (revenue, cost, _, _) = aggregateEngagement(engagement, entries);
      rows.add({
        id = engagement.id;
        name = engagement.name;
        revenue;
        cost;
        margin = revenue.toInt() - cost.toInt();
        marginPercent = marginPercent(revenue, cost);
      });
    };
    rows.toArray();
  };

  // Calendar-month bucketing. Timestamps are milliseconds since the Unix epoch;
  // the last `months` buckets end with the current month, oldest first.
  let millisPerDay : Int = 86_400_000;

  // Days since the Unix epoch for a millisecond timestamp, floored for negatives.
  func daysSinceEpoch(timestamp : Int) : Int {
    if (timestamp >= 0) {
      timestamp / millisPerDay;
    } else {
      -(((-timestamp) + millisPerDay - 1) / millisPerDay);
    };
  };

  // Civil date (year, month 1-12) from days since the Unix epoch (Howard Hinnant's algorithm).
  func civilFromDays(days : Int) : (Int, Int) {
    let z = days + 719_468;
    let era = (if (z >= 0) { z } else { z - 146_096 }) / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    (if (m <= 2) { y + 1 } else { y }, m);
  };

  // Absolute month index (year * 12 + month - 1) for a millisecond timestamp.
  func monthIndex(timestamp : Int) : Int {
    let (year, month) = civilFromDays(daysSinceEpoch(timestamp));
    year * 12 + (month - 1);
  };

  public func monthlyTrend(state : State, caller : Principal, months : Nat) : [Types.MonthlyTrendPoint] {
    if (months == 0) { return [] };
    let engagements = ownedEngagements(state, caller);
    let entries = ownedEntries(state, caller);
    let zeroHours : [Nat] = Array.tabulate(months, func _ = 0);
    let zeroRevenue : [Nat] = Array.tabulate(months, func _ = 0);
    let hoursVar : [var Nat] = zeroHours.toVarArray();
    let revenueVar : [var Nat] = zeroRevenue.toVarArray();
    let currentMonth = monthIndex(Time.now());
    let firstMonth = currentMonth - (months.toInt() - 1);
    // Fixed-fee engagements contribute their fee exactly once, on the first
    // billable entry encountered, matching aggregateEngagement.
    let fixedFeeCounted = Set.empty<ClientTypes.EngagementId>();
    for (entry in entries.values()) {
      let index = monthIndex(entry.date) - firstMonth;
      if (index >= 0 and index < months.toInt()) {
        let bucket = index.toNat();
        hoursVar[bucket] += entry.hours;
        switch (engagements.find(func e = e.id == entry.engagementId)) {
          case (?engagement) {
            if (entry.billable) {
              if (isFixedFee(engagement)) {
                if (not fixedFeeCounted.contains(engagement.id)) {
                  revenueVar[bucket] += engagement.fixedFee ?? 0;
                  fixedFeeCounted.add(engagement.id);
                };
              } else {
                revenueVar[bucket] += entry.hours * engagement.billableRate;
              };
            };
          };
          case null {};
        };
      };
    };
    Array.tabulate(months, func index = do {
      let absolute = firstMonth + index.toInt();
      {
        year = (absolute / 12).toNat();
        month = (absolute % 12 + 1).toNat();
        hours = hoursVar[index];
        revenue = revenueVar[index];
      };
    });
  };

  public func unbilledSummary(state : State, caller : Principal) : Types.UnbilledSummary {
    let engagements = ownedEngagements(state, caller);
    let entries = ownedEntries(state, caller);
    var unbilledHours = 0;
    var unbilledValue = 0;
    var entryCount = 0;
    // Fixed-fee engagements contribute their fee exactly once, on the first
    // unbilled billable entry encountered, matching aggregateEngagement.
    let fixedFeeCounted = Set.empty<ClientTypes.EngagementId>();
    for (entry in entries.values()) {
      if (entry.billable and not entry.invoiced) {
        unbilledHours += entry.hours;
        entryCount += 1;
        switch (engagements.find(func e = e.id == entry.engagementId)) {
          case (?engagement) {
            if (isFixedFee(engagement)) {
              if (not fixedFeeCounted.contains(engagement.id)) {
                unbilledValue += engagement.fixedFee ?? 0;
                fixedFeeCounted.add(engagement.id);
              };
            } else {
              unbilledValue += entry.hours * engagement.billableRate;
            };
          };
          case null {};
        };
      };
    };
    { unbilledHours; unbilledValue; entryCount };
  };
};
