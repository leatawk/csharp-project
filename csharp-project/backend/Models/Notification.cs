using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class Notification : BaseMongoEntity
{
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? GroupId { get; set; }

    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("priority")]
    public string Priority { get; set; } = "normal";

    [BsonElement("readStatus")]
    public bool ReadStatus { get; set; }

    [BsonElement("readAt")]
    public DateTime? ReadAt { get; set; }

    [BsonElement("data")]
    public BsonDocument Data { get; set; } = new();

    [BsonElement("channels")]
    public NotificationChannels Channels { get; set; } = new();

    [BsonElement("delivery")]
    public NotificationDelivery Delivery { get; set; } = new();

    [BsonElement("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}

[BsonIgnoreExtraElements]
public class NotificationChannels
{
    [BsonElement("inApp")]
    public bool InApp { get; set; } = true;

    [BsonElement("email")]
    public bool Email { get; set; }

    [BsonElement("push")]
    public bool Push { get; set; }

    [BsonElement("sms")]
    public bool Sms { get; set; }
}

[BsonIgnoreExtraElements]
public class NotificationDelivery
{
    [BsonElement("emailSent")]
    public bool EmailSent { get; set; }

    [BsonElement("emailSentAt")]
    public DateTime? EmailSentAt { get; set; }

    [BsonElement("pushSent")]
    public bool PushSent { get; set; }

    [BsonElement("pushSentAt")]
    public DateTime? PushSentAt { get; set; }

    [BsonElement("smsSent")]
    public bool SmsSent { get; set; }

    [BsonElement("smsSentAt")]
    public DateTime? SmsSentAt { get; set; }
}
