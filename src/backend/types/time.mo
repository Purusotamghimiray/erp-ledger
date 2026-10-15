import Common "common";

module {
  public type EngagementId = Common.EngagementId;
  public type TimeEntryId = Common.TimeEntryId;
  public type Timestamp = Common.Timestamp;

  public type TimeEntry = {
    id : TimeEntryId;
    owner : Principal;
    engagementId : EngagementId;
    date : Timestamp;
    hours : Nat;
    billable : Bool;
    description : Text;
    expenseAmount : ?Nat;
    invoiced : Bool;
    createdAt : Timestamp;
  };

  public type TimeEntryInput = {
    engagementId : EngagementId;
    date : Timestamp;
    hours : Nat;
    billable : Bool;
    description : Text;
    expenseAmount : ?Nat;
  };

  public type TimeEntryFilter = {
    engagementId : ?EngagementId;
    from : ?Timestamp;
    to : ?Timestamp;
    billable : ?Bool;
    invoiced : ?Bool;
  };
};
