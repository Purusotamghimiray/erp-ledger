import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import SeedLib "../lib/seed";

mixin (state : SeedLib.State) {
  public shared ({ caller }) func seedSampleData() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Sign-in required");
    };
    SeedLib.seedForCaller(state, caller);
  };
};
