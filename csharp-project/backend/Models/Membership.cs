using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class Membership : BaseMongoEntity
{
    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("role")]
    public string Role { get; set; } = "member";

    [BsonElement("slotNumber")]
    public int SlotNumber { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "pending";

    [BsonElement("joinedAt")]
    public DateTime? JoinedAt { get; set; }

    [BsonElement("leftAt")]
    public DateTime? LeftAt { get; set; }

    [BsonElement("removedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? RemovedBy { get; set; }

    [BsonElement("removalReason")]
    public string? RemovalReason { get; set; }

    [BsonElement("payoutPosition")]
    public int? PayoutPosition { get; set; }

    [BsonElement("hasReceivedPayout")]
    public bool HasReceivedPayout { get; set; }

    [BsonElement("payoutReceivedAt")]
    public DateTime? PayoutReceivedAt { get; set; }

    [BsonElement("contributionStats")]
    public ContributionStats ContributionStats { get; set; } = new();

    [BsonElement("guarantor")]
    public GuarantorInfo? Guarantor { get; set; }

    [BsonElement("invitedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? InvitedBy { get; set; }

    [BsonElement("inviteAcceptedAt")]
    public DateTime? InviteAcceptedAt { get; set; }

    [BsonElement("notes")]
    public string? Notes { get; set; }
}

[BsonIgnoreExtraElements]
public class ContributionStats
{
    [BsonElement("totalExpected")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalExpected { get; set; }

    [BsonElement("totalPaid")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalPaid { get; set; }

    [BsonElement("totalLate")]
    public int TotalLate { get; set; }

    [BsonElement("totalMissed")]
    public int TotalMissed { get; set; }

    [BsonElement("currentStreak")]
    public int CurrentStreak { get; set; }

    [BsonElement("lastContributionAt")]
    public DateTime? LastContributionAt { get; set; }
}

[BsonIgnoreExtraElements]
public class GuarantorInfo
{
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? UserId { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "pending";

    [BsonElement("acceptedAt")]
    public DateTime? AcceptedAt { get; set; }
}
