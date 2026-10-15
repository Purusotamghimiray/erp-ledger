import Common "common";

module {
  public type ClientId = Common.ClientId;
  public type EngagementId = Common.EngagementId;
  public type Timestamp = Common.Timestamp;

  public type ClientStatus = { #lead; #active; #archived };

  public type Client = {
    id : ClientId;
    owner : Principal;
    name : Text;
    contactPerson : Text;
    email : Text;
    industry : Text;
    status : ClientStatus;
    createdAt : Timestamp;
  };

  public type BillingModel = { #hourly; #fixedFee };

  public type EngagementStatus = { #proposed; #active; #completed; #archived };

  public type Engagement = {
    id : EngagementId;
    owner : Principal;
    clientId : ClientId;
    name : Text;
    scope : Text;
    startDate : Timestamp;
    endDate : ?Timestamp;
    billingModel : BillingModel;
    fixedFee : ?Nat;
    billableRate : Nat;
    costRate : Nat;
    status : EngagementStatus;
    createdAt : Timestamp;
  };

  public type ClientInput = {
    name : Text;
    contactPerson : Text;
    email : Text;
    industry : Text;
    status : ClientStatus;
  };

  public type EngagementInput = {
    clientId : ClientId;
    name : Text;
    scope : Text;
    startDate : Timestamp;
    endDate : ?Timestamp;
    billingModel : BillingModel;
    fixedFee : ?Nat;
    billableRate : Nat;
    costRate : Nat;
    status : EngagementStatus;
  };

  public type ClientFilter = {
    search : ?Text;
    status : ?ClientStatus;
    industry : ?Text;
  };

  public type EngagementFilter = {
    search : ?Text;
    status : ?EngagementStatus;
    clientId : ?ClientId;
  };
};
