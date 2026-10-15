import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import ClientLib "../lib/clients";
import Types "../types/time";

module {
  public type State = {
    entries : Map.Map<Types.TimeEntryId, Types.TimeEntry>;
    counters : ClientLib.Counters;
  };

  let dayMillis : Int = 86_400_000;

  func entryMatches(entry : Types.TimeEntry, filter : Types.TimeEntryFilter) : Bool {
    switch (filter.engagementId) {
      case (?engagementId) {
        if (entry.engagementId != engagementId) { return false };
      };
      case null {};
    };
    switch (filter.from) {
      case (?from) {
        if (entry.date < from) { return false };
      };
      case null {};
    };
    switch (filter.to) {
      case (?to) {
        if (entry.date > to) { return false };
      };
      case null {};
    };
    switch (filter.billable) {
      case (?billable) {
        if (entry.billable != billable) { return false };
      };
      case null {};
    };
    switch (filter.invoiced) {
      case (?invoiced) {
        if (entry.invoiced != invoiced) { return false };
      };
      case null {};
    };
    true;
  };

  public func listEntries(state : State, caller : Principal, filter : Types.TimeEntryFilter) : [Types.TimeEntry] {
    let result = List.empty<Types.TimeEntry>();
    for (entry in state.entries.values()) {
      if (Principal.equal(entry.owner, caller) and entryMatches(entry, filter)) {
        result.add(entry);
      };
    };
    result.toArray();
  };

  public func getEntry(state : State, caller : Principal, id : Types.TimeEntryId) : ?Types.TimeEntry {
    switch (state.entries.get(id)) {
      case (?entry) {
        if (Principal.equal(entry.owner, caller)) { ?entry } else { null };
      };
      case null { null };
    };
  };

  public func createEntry(state : State, caller : Principal, input : Types.TimeEntryInput) : Types.TimeEntry {
    let id = state.counters.nextEntryId;
    state.counters.nextEntryId := id + 1;
    let entry : Types.TimeEntry = {
      id;
      owner = caller;
      engagementId = input.engagementId;
      date = input.date;
      hours = input.hours;
      billable = input.billable;
      description = input.description;
      expenseAmount = input.expenseAmount;
      invoiced = false;
      createdAt = Time.now();
    };
    state.entries.add(id, entry);
    entry;
  };

  public func updateEntry(state : State, caller : Principal, id : Types.TimeEntryId, input : Types.TimeEntryInput) : ?Types.TimeEntry {
    switch (state.entries.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return null };
        let updated : Types.TimeEntry = {
          existing with
          engagementId = input.engagementId;
          date = input.date;
          hours = input.hours;
          billable = input.billable;
          description = input.description;
          expenseAmount = input.expenseAmount;
        };
        state.entries.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func deleteEntry(state : State, caller : Principal, id : Types.TimeEntryId) : Bool {
    switch (state.entries.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return false };
        state.entries.remove(id);
        true;
      };
      case null { false };
    };
  };

  public func setInvoiced(state : State, caller : Principal, id : Types.TimeEntryId, invoiced : Bool) : ?Types.TimeEntry {
    switch (state.entries.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return null };
        let updated : Types.TimeEntry = { existing with invoiced };
        state.entries.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func listWeek(state : State, caller : Principal, weekStart : Types.Timestamp) : [Types.TimeEntry] {
    let weekEnd = weekStart + (7 * dayMillis) - 1;
    let result = List.empty<Types.TimeEntry>();
    for (entry in state.entries.values()) {
      if (Principal.equal(entry.owner, caller) and entry.date >= weekStart and entry.date <= weekEnd) {
        result.add(entry);
      };
    };
    result.toArray();
  };
};
