using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class FundRotation : BaseMongoEntity
{
    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = string.Empty;

    [BsonElement("cycleNumber")]
    public int CycleNumber { get; set; }

    [BsonElement("recipientMembershipId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string RecipientMembershipId { get; set; } = string.Empty;

    [BsonElement("recipientUserId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string RecipientUserId { get; set; } = string.Empty;

    [BsonElement("payoutAmount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal PayoutAmount { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("scheduledPayoutDate")]
    public DateTime ScheduledPayoutDate { get; set; }

    [BsonElement("actualPayoutDate")]
    public DateTime? ActualPayoutDate { get; set; }

    [BsonElement("contributionDueDate")]
    public DateTime ContributionDueDate { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "scheduled";

    [BsonElement("contributions")]
    public List<RotationContributionRef> Contributions { get; set; } = new();

    [BsonElement("payout")]
    public RotationPayout Payout { get; set; } = new();

    [BsonElement("bidding")]
    public RotationBidding? Bidding { get; set; }

    [BsonElement("lottery")]
    public RotationLottery? Lottery { get; set; }

    [BsonElement("notes")]
    public string? Notes { get; set; }
}

[BsonIgnoreExtraElements]
public class RotationContributionRef
{
    [BsonElement("contributionId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ContributionId { get; set; } = string.Empty;

    [BsonElement("membershipId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string MembershipId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "pending";

    [BsonElement("amount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Amount { get; set; }
}

[BsonIgnoreExtraElements]
public class RotationPayout
{
    [BsonElement("method")]
    public string? Method { get; set; }

    [BsonElement("paymentMethodId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? PaymentMethodId { get; set; }

    [BsonElement("processorName")]
    public string? ProcessorName { get; set; }

    [BsonElement("processorTransactionId")]
    public string? ProcessorTransactionId { get; set; }

    [BsonElement("processorFee")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? ProcessorFee { get; set; }

    [BsonElement("failureCode")]
    public string? FailureCode { get; set; }

    [BsonElement("failureMessage")]
    public string? FailureMessage { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class RotationBidding
{
    [BsonElement("winningBidAmount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? WinningBidAmount { get; set; }

    [BsonElement("winnerUserId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? WinnerUserId { get; set; }

    [BsonElement("bids")]
    public List<RotationBid> Bids { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class RotationBid
{
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("amount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Amount { get; set; }

    [BsonElement("submittedAt")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class RotationLottery
{
    [BsonElement("seed")]
    public string? Seed { get; set; }

    [BsonElement("drawnAt")]
    public DateTime? DrawnAt { get; set; }

    [BsonElement("drawnBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? DrawnBy { get; set; }
}
