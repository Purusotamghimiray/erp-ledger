import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import TimeLib "../lib/time";
import Types "../types/time";

mixin (state : TimeLib.State) {
  func requireSignedInTime(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Sign-in required");
    };
  };

  public query ({ caller }) func listTimeEntries(filter : Types.TimeEntryFilter) : async [Types.TimeEntry] {
    requireSignedInTime(caller);
    TimeLib.listEntries(state, caller, filter);
  };

  public query ({ caller }) func getTimeEntry(id : Types.TimeEntryId) : async ?Types.TimeEntry {
    requireSignedInTime(caller);
    TimeLib.getEntry(state, caller, id);
  };

  public shared ({ caller }) func createTimeEntry(input : Types.TimeEntryInput) : async Types.TimeEntry {
    requireSignedInTime(caller);
    TimeLib.createEntry(state, caller, input);
  };

  public shared ({ caller }) func updateTimeEntry(id : Types.TimeEntryId, input : Types.TimeEntryInput) : async ?Types.TimeEntry {
    requireSignedInTime(caller);
    TimeLib.updateEntry(state, caller, id, input);
  };

  public shared ({ caller }) func deleteTimeEntry(id : Types.TimeEntryId) : async Bool {
    requireSignedInTime(caller);
    TimeLib.deleteEntry(state, caller, id);
  };

  public shared ({ caller }) func setTimeEntryInvoiced(id : Types.TimeEntryId, invoiced : Bool) : async ?Types.TimeEntry {
    requireSignedInTime(caller);
    TimeLib.setInvoiced(state, caller, id, invoiced);
  };

  public query ({ caller }) func listWeekEntries(weekStart : Types.Timestamp) : async [Types.TimeEntry] {
    requireSignedInTime(caller);
    TimeLib.listWeek(state, caller, weekStart);
  };
};
