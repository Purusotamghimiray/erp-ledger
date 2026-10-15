import Principal "mo:core/Principal";
import Time "mo:core/Time";
import ClientLib "../lib/clients";
import TimeLib "../lib/time";

module {
  public type State = {
    clients : ClientLib.State;
    time : TimeLib.State;
  };

  let dayMillis : Int = 86_400_000;

  public func seedForCaller(state : State, caller : Principal) : () {
    let now = Time.now();

    let acme = ClientLib.createClient(state.clients, caller, {
      name = "Acme Manufacturing";
      contactPerson = "Dana Whitfield";
      email = "dana@acme.example";
      industry = "Manufacturing";
      status = #active;
    });

    let northwind = ClientLib.createClient(state.clients, caller, {
      name = "Northwind Retail Group";
      contactPerson = "Priya Raman";
      email = "priya@northwind.example";
      industry = "Retail";
      status = #active;
    });

    let lumen = ClientLib.createClient(state.clients, caller, {
      name = "Lumen Health";
      contactPerson = "Marcus Bell";
      email = "marcus@lumenhealth.example";
      industry = "Healthcare";
      status = #lead;
    });

    let erpRollout = ClientLib.createEngagement(state.clients, caller, {
      clientId = acme.id;
      name = "ERP Rollout Phase 1";
      scope = "Finance and inventory module implementation, data migration, and user training.";
      startDate = now - (90 * dayMillis);
      endDate = ?(now + (90 * dayMillis));
      billingModel = #hourly;
      fixedFee = null;
      billableRate = 180;
      costRate = 95;
      status = #active;
    });

    let processAudit = ClientLib.createEngagement(state.clients, caller, {
      clientId = northwind.id;
      name = "Process Audit";
      scope = "Assessment of order-to-cash process and recommendations report.";
      startDate = now - (45 * dayMillis);
      endDate = ?(now + (15 * dayMillis));
      billingModel = #fixedFee;
      fixedFee = ?12000;
      billableRate = 0;
      costRate = 90;
      status = #active;
    });

    let discovery = ClientLib.createEngagement(state.clients, caller, {
      clientId = lumen.id;
      name = "Discovery Workshop";
      scope = "Two-day discovery workshop covering clinical operations requirements.";
      startDate = now - (10 * dayMillis);
      endDate = null;
      billingModel = #hourly;
      fixedFee = null;
      billableRate = 200;
      costRate = 100;
      status = #proposed;
    });

    let _ = TimeLib.createEntry(state.time, caller, {
      engagementId = erpRollout.id;
      date = now - (80 * dayMillis);
      hours = 16;
      billable = true;
      description = "Requirements gathering with finance team";
      expenseAmount = null;
    });

    let _ = TimeLib.createEntry(state.time, caller, {
      engagementId = erpRollout.id;
      date = now - (60 * dayMillis);
      hours = 24;
      billable = true;
      description = "Chart of accounts configuration";
      expenseAmount = ?250;
    });

    let _ = TimeLib.createEntry(state.time, caller, {
      engagementId = erpRollout.id;
      date = now - (30 * dayMillis);
      hours = 12;
      billable = false;
      description = "Internal documentation and review";
      expenseAmount = null;
    });

    let _ = TimeLib.createEntry(state.time, caller, {
      engagementId = processAudit.id;
      date = now - (40 * dayMillis);
      hours = 20;
      billable = true;
      description = "Order-to-cash process interviews";
      expenseAmount = null;
    });

    let _ = TimeLib.createEntry(state.time, caller, {
      engagementId = processAudit.id;
      date = now - (20 * dayMillis);
      hours = 18;
      billable = true;
      description = "Draft recommendations report";
      expenseAmount = ?120;
    });

    let _ = TimeLib.createEntry(state.time, caller, {
      engagementId = discovery.id;
      date = now - (5 * dayMillis);
      hours = 8;
      billable = true;
      description = "Pre-workshop scoping call";
      expenseAmount = null;
    });
  };
};
