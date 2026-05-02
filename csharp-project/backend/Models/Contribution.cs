using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class Contribution : BaseMongoEntity
{
    [BsonElement("idempotencyKey")]
    public string IdempotencyKey { get; set; } = string.Empty;

    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = string.Empty;

    [BsonElement("membershipId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string MembershipId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("rotationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? RotationId { get; set; }

    [BsonElement("cycleNumber")]
    public int CycleNumber { get; set; }

    [BsonElement("amount")]
    public ContributionAmount Amount { get; set; } = new();

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("dueDate")]
    public DateTime DueDate { get; set; }

    [BsonElement("gracePeriodEnds")]
    public DateTime GracePeriodEnds { get; set; }

    [BsonElement("paidAt")]
    public DateTime? PaidAt { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "scheduled";

    [BsonElement("payment")]
    public ContributionPayment Payment { get; set; } = new();

    [BsonElement("isAutoDebit")]
    public bool IsAutoDebit { get; set; }

    [BsonElement("isManualOverride")]
    public bool IsManualOverride { get; set; }

    [BsonElement("manualOverrideBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ManualOverrideBy { get; set; }

    [BsonElement("manualOverrideReason")]
    public string? ManualOverrideReason { get; set; }

    [BsonElement("statusHistory")]
    public List<ContributionStatusHistory> StatusHistory { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class ContributionAmount
{
    [BsonElement("expected")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Expected { get; set; }

    [BsonElement("paid")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Paid { get; set; }

    [BsonElement("penalty")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Penalty { get; set; }

    [BsonElement("guaranteeContribution")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal GuaranteeContribution { get; set; }

    [BsonElement("net")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Net { get; set; }
}

[BsonIgnoreExtraElements]
public class ContributionPayment
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

    [BsonElement("processorResponse")]
    public BsonDocument? ProcessorResponse { get; set; }

    [BsonElement("failureCode")]
    public string? FailureCode { get; set; }

    [BsonElement("failureMessage")]
    public string? FailureMessage { get; set; }

    [BsonElement("retryCount")]
    public int RetryCount { get; set; }

    [BsonElement("lastRetryAt")]
    public DateTime? LastRetryAt { get; set; }

    [BsonElement("nextRetryAt")]
    public DateTime? NextRetryAt { get; set; }
}

[BsonIgnoreExtraElements]
public class ContributionStatusHistory
{
    [BsonElement("status")]
    public string Status { get; set; } = string.Empty;

    [BsonElement("changedAt")]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("changedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ChangedBy { get; set; }

    [BsonElement("reason")]
    public string? Reason { get; set; }
}
