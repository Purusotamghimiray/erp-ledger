import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    clients : Map.Map<Nat, Client>;
    engagements : Map.Map<Nat, Engagement>;
    timeEntries : Map.Map<Nat, TimeEntry>;
    counters : { var nextClientId : Nat; var nextEngagementId : Nat; var nextEntryId : Nat };
  };

  public type ClientStatus = { #lead; #active; #archived };

  public type Client = {
    id : Nat;
    owner : Principal;
    name : Text;
    contactPerson : Text;
    email : Text;
    industry : Text;
    status : ClientStatus;
    createdAt : Int;
  };

  public type BillingModel = { #hourly; #fixedFee };

  public type EngagementStatus = { #proposed; #active; #completed; #archived };

  public type Engagement = {
    id : Nat;
    owner : Principal;
    clientId : Nat;
    name : Text;
    scope : Text;
    startDate : Int;
    endDate : ?Int;
    billingModel : BillingModel;
    fixedFee : ?Nat;
    billableRate : Nat;
    costRate : Nat;
    status : EngagementStatus;
    createdAt : Int;
  };

  public type TimeEntry = {
    id : Nat;
    owner : Principal;
    engagementId : Nat;
    date : Int;
    hours : Nat;
    billable : Bool;
    description : Text;
    expenseAmount : ?Nat;
    invoiced : Bool;
    createdAt : Int;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      clients = Map.empty();
      engagements = Map.empty();
      timeEntries = Map.empty();
      counters = { var nextClientId = 0; var nextEngagementId = 0; var nextEntryId = 0 };
    };
  };
};
