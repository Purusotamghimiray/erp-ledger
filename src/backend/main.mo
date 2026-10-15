import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ClientTypes "types/clients";
import TimeTypes "types/time";
import ClientLib "lib/clients";
import TimeLib "lib/time";
import AnalyticsLib "lib/analytics";
import SeedLib "lib/seed";
import ClientsApi "mixins/clients-api";
import TimeApi "mixins/time-api";
import AnalyticsApi "mixins/analytics-api";
import SeedApi "mixins/seed-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;

  let clients : Map.Map<ClientTypes.ClientId, ClientTypes.Client>;
  let engagements : Map.Map<ClientTypes.EngagementId, ClientTypes.Engagement>;
  let timeEntries : Map.Map<TimeTypes.TimeEntryId, TimeTypes.TimeEntry>;
  let counters : { var nextClientId : Nat; var nextEngagementId : Nat; var nextEntryId : Nat };

  transient let clientState : ClientLib.State = { clients; engagements; counters };
  transient let timeState : TimeLib.State = { entries = timeEntries; counters };
  transient let analyticsState : AnalyticsLib.State = { clients; engagements; entries = timeEntries };
  transient let seedState : SeedLib.State = { clients = clientState; time = timeState };

  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  func clientStatusText(status : ClientTypes.ClientStatus) : Text {
    switch (status) {
      case (#lead) { "lead" };
      case (#active) { "active" };
      case (#archived) { "archived" };
    };
  };

  func engagementStatusText(status : ClientTypes.EngagementStatus) : Text {
    switch (status) {
      case (#proposed) { "proposed" };
      case (#active) { "active" };
      case (#completed) { "completed" };
      case (#archived) { "archived" };
    };
  };

  func billingModelText(model : ClientTypes.BillingModel) : Text {
    switch (model) {
      case (#hourly) { "hourly" };
      case (#fixedFee) { "fixedFee" };
    };
  };

  include MixinAuthorization(accessControlState, null);
  include ClientsApi(clientState);
  include TimeApi(timeState);
  include AnalyticsApi(analyticsState);
  include SeedApi(seedState);
  include ApiDocMixin();
  include Expose({
    entities = [
      clients.toEntityManual("client", "Client", "id")
        .sample({
          id = 0;
          owner = samplePrincipal;
          name = "";
          contactPerson = "";
          email = "";
          industry = "";
          status = #lead;
          createdAt = 0;
        })
        .payload("id", func c = c.id)
        .payload("owner", func c = c.owner)
        .payload("name", func c = c.name)
        .payload("contactPerson", func c = c.contactPerson)
        .payload("email", func c = c.email)
        .payload("industry", func c = c.industry)
        .payload("status", func c = clientStatusText(c.status))
        .payload("createdAt", func c = c.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      engagements.toEntityManual("engagement", "Engagement", "id")
        .sample({
          id = 0;
          owner = samplePrincipal;
          clientId = 0;
          name = "";
          scope = "";
          startDate = 0;
          endDate = ?0;
          billingModel = #hourly;
          fixedFee = ?0;
          billableRate = 0;
          costRate = 0;
          status = #proposed;
          createdAt = 0;
        })
        .payload("id", func e = e.id)
        .payload("owner", func e = e.owner)
        .payload("clientId", func e = e.clientId)
        .edge("clientId", "client")
        .payload("name", func e = e.name)
        .payload("scope", func e = e.scope)
        .payload("startDate", func e = e.startDate)
        .payload("endDate", func e = e.endDate ?? 0)
        .payload("billingModel", func e = billingModelText(e.billingModel))
        .payload("fixedFee", func e = e.fixedFee ?? 0)
        .payload("billableRate", func e = e.billableRate)
        .payload("costRate", func e = e.costRate)
        .payload("status", func e = engagementStatusText(e.status))
        .payload("createdAt", func e = e.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      timeEntries.toEntityManual("timeEntry", "TimeEntry", "id")
        .sample({
          id = 0;
          owner = samplePrincipal;
          engagementId = 0;
          date = 0;
          hours = 0;
          billable = false;
          description = "";
          expenseAmount = ?0;
          invoiced = false;
          createdAt = 0;
        })
        .payload("id", func t = t.id)
        .payload("owner", func t = t.owner)
        .payload("engagementId", func t = t.engagementId)
        .edge("engagementId", "engagement")
        .payload("date", func t = t.date)
        .payload("hours", func t = t.hours)
        .payload("billable", func t = t.billable)
        .payload("description", func t = t.description)
        .payload("expenseAmount", func t = t.expenseAmount ?? 0)
        .payload("invoiced", func t = t.invoiced)
        .payload("createdAt", func t = t.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
