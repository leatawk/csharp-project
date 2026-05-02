using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class Dispute : BaseMongoEntity
{
    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = string.Empty;

    [BsonElement("raisedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string RaisedBy { get; set; } = string.Empty;

    [BsonElement("againstUserId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? AgainstUserId { get; set; }

    [BsonElement("relatedTo")]
    public DisputeRelatedEntity RelatedTo { get; set; } = new();

    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("evidence")]
    public List<DisputeEvidence> Evidence { get; set; } = new();

    [BsonElement("status")]
    public string Status { get; set; } = "open";

    [BsonElement("resolution")]
    public DisputeResolution Resolution { get; set; } = new();

    [BsonElement("comments")]
    public List<DisputeComment> Comments { get; set; } = new();

    [BsonElement("escalatedAt")]
    public DateTime? EscalatedAt { get; set; }

    [BsonElement("escalatedTo")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? EscalatedTo { get; set; }
}

[BsonIgnoreExtraElements]
public class DisputeRelatedEntity
{
    [BsonElement("type")]
    public string Type { get; set; } = "other";

    [BsonElement("entityId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string EntityId { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class DisputeEvidence
{
    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("url")]
    public string Url { get; set; } = string.Empty;

    [BsonElement("uploadedAt")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("uploadedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? UploadedBy { get; set; }

    [BsonElement("description")]
    public string? Description { get; set; }
}

[BsonIgnoreExtraElements]
public class DisputeResolution
{
    [BsonElement("decision")]
    public string? Decision { get; set; }

    [BsonElement("resolvedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ResolvedBy { get; set; }

    [BsonElement("resolvedAt")]
    public DateTime? ResolvedAt { get; set; }

    [BsonElement("notes")]
    public string? Notes { get; set; }

    [BsonElement("actions")]
    public List<DisputeAction> Actions { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class DisputeAction
{
    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class DisputeComment
{
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("isInternal")]
    public bool IsInternal { get; set; }
}
