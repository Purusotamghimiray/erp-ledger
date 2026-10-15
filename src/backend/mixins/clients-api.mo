import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import ClientLib "../lib/clients";
import Types "../types/clients";

mixin (state : ClientLib.State) {
  func requireSignedInClients(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Sign-in required");
    };
  };

  public query ({ caller }) func listClients(filter : Types.ClientFilter) : async [Types.Client] {
    requireSignedInClients(caller);
    ClientLib.listClients(state, caller, filter);
  };

  public query ({ caller }) func getClient(id : Types.ClientId) : async ?Types.Client {
    requireSignedInClients(caller);
    ClientLib.getClient(state, caller, id);
  };

  public shared ({ caller }) func createClient(input : Types.ClientInput) : async Types.Client {
    requireSignedInClients(caller);
    ClientLib.createClient(state, caller, input);
  };

  public shared ({ caller }) func updateClient(id : Types.ClientId, input : Types.ClientInput) : async ?Types.Client {
    requireSignedInClients(caller);
    ClientLib.updateClient(state, caller, id, input);
  };

  public shared ({ caller }) func deleteClient(id : Types.ClientId) : async Bool {
    requireSignedInClients(caller);
    ClientLib.deleteClient(state, caller, id);
  };

  public query ({ caller }) func listEngagements(filter : Types.EngagementFilter) : async [Types.Engagement] {
    requireSignedInClients(caller);
    ClientLib.listEngagements(state, caller, filter);
  };

  public query ({ caller }) func getEngagement(id : Types.EngagementId) : async ?Types.Engagement {
    requireSignedInClients(caller);
    ClientLib.getEngagement(state, caller, id);
  };

  public shared ({ caller }) func createEngagement(input : Types.EngagementInput) : async Types.Engagement {
    requireSignedInClients(caller);
    ClientLib.createEngagement(state, caller, input);
  };

  public shared ({ caller }) func updateEngagement(id : Types.EngagementId, input : Types.EngagementInput) : async ?Types.Engagement {
    requireSignedInClients(caller);
    ClientLib.updateEngagement(state, caller, id, input);
  };

  public shared ({ caller }) func deleteEngagement(id : Types.EngagementId) : async Bool {
    requireSignedInClients(caller);
    ClientLib.deleteEngagement(state, caller, id);
  };
};
