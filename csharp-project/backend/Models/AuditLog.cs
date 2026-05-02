using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class AuditLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("actorId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ActorId { get; set; }

    [BsonElement("actorType")]
    public string ActorType { get; set; } = "system";

    [BsonElement("actorIp")]
    public string? ActorIp { get; set; }

    [BsonElement("actorDevice")]
    public string? ActorDevice { get; set; }

    [BsonElement("action")]
    public string Action { get; set; } = string.Empty;

    [BsonElement("resource")]
    public string Resource { get; set; } = string.Empty;

    [BsonElement("resourceId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ResourceId { get; set; } = string.Empty;

    [BsonElement("changes")]
    public AuditChanges Changes { get; set; } = new();

    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? GroupId { get; set; }

    [BsonElement("metadata")]
    public BsonDocument Metadata { get; set; } = new();

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [BsonElement("retentionCategory")]
    public string RetentionCategory { get; set; } = "general";
}

[BsonIgnoreExtraElements]
public class AuditChanges
{
    [BsonElement("before")]
    public BsonDocument? Before { get; set; }

    [BsonElement("after")]
    public BsonDocument? After { get; set; }

    [BsonElement("diff")]
    public BsonDocument? Diff { get; set; }
}
