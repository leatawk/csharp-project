using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class RoscaGroup : BaseMongoEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("createdBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedBy { get; set; } = string.Empty;

    [BsonElement("config")]
    public RoscaGroupConfig Config { get; set; } = new();

    [BsonElement("state")]
    public RoscaGroupState State { get; set; } = new();

    [BsonElement("memberSummary")]
    public List<GroupMemberSummary> MemberSummary { get; set; } = new();

    [BsonElement("visibility")]
    public string Visibility { get; set; } = "public";

    [BsonElement("inviteCode")]
    public string? InviteCode { get; set; }

    [BsonElement("tags")]
    public List<string> Tags { get; set; } = new();

    [BsonElement("guaranteePool")]
    public GuaranteePool GuaranteePool { get; set; } = new();

    [BsonElement("deletedAt")]
    public DateTime? DeletedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class RoscaGroupConfig
{
    [BsonElement("contributionAmount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal ContributionAmount { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("frequency")]
    public string Frequency { get; set; } = "monthly";

    [BsonElement("totalSlots")]
    public int TotalSlots { get; set; }

    [BsonElement("duration")]
    public int Duration { get; set; }

    [BsonElement("payoutMethod")]
    public string PayoutMethod { get; set; } = "fixed";

    [BsonElement("payoutOrder")]
    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> PayoutOrder { get; set; } = new();

    [BsonElement("gracePeriodDays")]
    public int GracePeriodDays { get; set; } = 3;

    [BsonElement("latePenaltyPercent")]
    public decimal? LatePenaltyPercent { get; set; }

    [BsonElement("latePenaltyFlat")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? LatePenaltyFlat { get; set; }

    [BsonElement("allowEarlyPayout")]
    public bool AllowEarlyPayout { get; set; }

    [BsonElement("requireGuarantor")]
    public bool RequireGuarantor { get; set; }

    [BsonElement("minTrustScore")]
    public int? MinTrustScore { get; set; }

    [BsonElement("allowMidCycleJoin")]
    public bool AllowMidCycleJoin { get; set; }

    [BsonElement("startCondition")]
    public string StartCondition { get; set; } = "when_full";

    [BsonElement("scheduledStartDate")]
    public DateTime? ScheduledStartDate { get; set; }
}

[BsonIgnoreExtraElements]
public class RoscaGroupState
{
    [BsonElement("status")]
    public string Status { get; set; } = "draft";

    [BsonElement("currentCycle")]
    public int CurrentCycle { get; set; }

    [BsonElement("currentRotationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? CurrentRotationId { get; set; }

    [BsonElement("filledSlots")]
    public int FilledSlots { get; set; }

    [BsonElement("totalCollected")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalCollected { get; set; }

    [BsonElement("poolBalance")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal PoolBalance { get; set; }

    [BsonElement("formingStartedAt")]
    public DateTime? FormingStartedAt { get; set; }

    [BsonElement("activeStartedAt")]
    public DateTime? ActiveStartedAt { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }

    [BsonElement("nextContributionDue")]
    public DateTime? NextContributionDue { get; set; }

    [BsonElement("nextPayoutDate")]
    public DateTime? NextPayoutDate { get; set; }
}

[BsonIgnoreExtraElements]
public class GroupMemberSummary
{
    [BsonElement("memberId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string MemberId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [BsonElement("profilePicture")]
    public string? ProfilePicture { get; set; }

    [BsonElement("role")]
    public string Role { get; set; } = "member";

    [BsonElement("slotNumber")]
    public int SlotNumber { get; set; }

    [BsonElement("hasReceivedPayout")]
    public bool HasReceivedPayout { get; set; }

    [BsonElement("contributionStatus")]
    public string ContributionStatus { get; set; } = "current";
}

[BsonIgnoreExtraElements]
public class GuaranteePool
{
    [BsonElement("enabled")]
    public bool Enabled { get; set; }

    [BsonElement("balance")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Balance { get; set; }

    [BsonElement("contributionPercent")]
    public decimal? ContributionPercent { get; set; }
}
