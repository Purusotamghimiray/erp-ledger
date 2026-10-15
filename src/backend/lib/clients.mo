import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/clients";

module {
  public type Counters = {
    var nextClientId : Nat;
    var nextEngagementId : Nat;
    var nextEntryId : Nat;
  };

  public type State = {
    clients : Map.Map<Types.ClientId, Types.Client>;
    engagements : Map.Map<Types.EngagementId, Types.Engagement>;
    counters : Counters;
  };

  func matchesSearch(haystack : Text, needle : Text) : Bool {
    haystack.toLower().contains(#text (needle.toLower()));
  };

  func clientMatches(client : Types.Client, filter : Types.ClientFilter) : Bool {
    switch (filter.search) {
      case (?term) {
        if (not (matchesSearch(client.name, term) or matchesSearch(client.contactPerson, term))) {
          return false;
        };
      };
      case null {};
    };
    switch (filter.status) {
      case (?status) {
        if (client.status != status) { return false };
      };
      case null {};
    };
    switch (filter.industry) {
      case (?industry) {
        if (not (matchesSearch(client.industry, industry))) { return false };
      };
      case null {};
    };
    true;
  };

  func engagementMatches(engagement : Types.Engagement, filter : Types.EngagementFilter) : Bool {
    switch (filter.search) {
      case (?term) {
        if (not (matchesSearch(engagement.name, term) or matchesSearch(engagement.scope, term))) {
          return false;
        };
      };
      case null {};
    };
    switch (filter.status) {
      case (?status) {
        if (engagement.status != status) { return false };
      };
      case null {};
    };
    switch (filter.clientId) {
      case (?clientId) {
        if (engagement.clientId != clientId) { return false };
      };
      case null {};
    };
    true;
  };

  public func listClients(state : State, caller : Principal, filter : Types.ClientFilter) : [Types.Client] {
    let result = List.empty<Types.Client>();
    for (client in state.clients.values()) {
      if (Principal.equal(client.owner, caller) and clientMatches(client, filter)) {
        result.add(client);
      };
    };
    result.toArray();
  };

  public func getClient(state : State, caller : Principal, id : Types.ClientId) : ?Types.Client {
    switch (state.clients.get(id)) {
      case (?client) {
        if (Principal.equal(client.owner, caller)) { ?client } else { null };
      };
      case null { null };
    };
  };

  public func createClient(state : State, caller : Principal, input : Types.ClientInput) : Types.Client {
    let id = state.counters.nextClientId;
    state.counters.nextClientId := id + 1;
    let client : Types.Client = {
      id;
      owner = caller;
      name = input.name;
      contactPerson = input.contactPerson;
      email = input.email;
      industry = input.industry;
      status = input.status;
      createdAt = Time.now();
    };
    state.clients.add(id, client);
    client;
  };

  public func updateClient(state : State, caller : Principal, id : Types.ClientId, input : Types.ClientInput) : ?Types.Client {
    switch (state.clients.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return null };
        let updated : Types.Client = {
          existing with
          name = input.name;
          contactPerson = input.contactPerson;
          email = input.email;
          industry = input.industry;
          status = input.status;
        };
        state.clients.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func deleteClient(state : State, caller : Principal, id : Types.ClientId) : Bool {
    switch (state.clients.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return false };
        state.clients.remove(id);
        true;
      };
      case null { false };
    };
  };

  public func listEngagements(state : State, caller : Principal, filter : Types.EngagementFilter) : [Types.Engagement] {
    let result = List.empty<Types.Engagement>();
    for (engagement in state.engagements.values()) {
      if (Principal.equal(engagement.owner, caller) and engagementMatches(engagement, filter)) {
        result.add(engagement);
      };
    };
    result.toArray();
  };

  public func getEngagement(state : State, caller : Principal, id : Types.EngagementId) : ?Types.Engagement {
    switch (state.engagements.get(id)) {
      case (?engagement) {
        if (Principal.equal(engagement.owner, caller)) { ?engagement } else { null };
      };
      case null { null };
    };
  };

  public func createEngagement(state : State, caller : Principal, input : Types.EngagementInput) : Types.Engagement {
    let id = state.counters.nextEngagementId;
    state.counters.nextEngagementId := id + 1;
    let engagement : Types.Engagement = {
      id;
      owner = caller;
      clientId = input.clientId;
      name = input.name;
      scope = input.scope;
      startDate = input.startDate;
      endDate = input.endDate;
      billingModel = input.billingModel;
      fixedFee = input.fixedFee;
      billableRate = input.billableRate;
      costRate = input.costRate;
      status = input.status;
      createdAt = Time.now();
    };
    state.engagements.add(id, engagement);
    engagement;
  };

  public func updateEngagement(state : State, caller : Principal, id : Types.EngagementId, input : Types.EngagementInput) : ?Types.Engagement {
    switch (state.engagements.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return null };
        let updated : Types.Engagement = {
          existing with
          clientId = input.clientId;
          name = input.name;
          scope = input.scope;
          startDate = input.startDate;
          endDate = input.endDate;
          billingModel = input.billingModel;
          fixedFee = input.fixedFee;
          billableRate = input.billableRate;
          costRate = input.costRate;
          status = input.status;
        };
        state.engagements.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func deleteEngagement(state : State, caller : Principal, id : Types.EngagementId) : Bool {
    switch (state.engagements.get(id)) {
      case (?existing) {
        if (not Principal.equal(existing.owner, caller)) { return false };
        state.engagements.remove(id);
        true;
      };
      case null { false };
    };
  };
};
