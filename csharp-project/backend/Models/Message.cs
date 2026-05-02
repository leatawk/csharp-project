using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class Message : BaseMongoEntity
{
    [BsonElement("groupId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = string.Empty;

    [BsonElement("senderId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string SenderId { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("messageType")]
    public string MessageType { get; set; } = "text";

    [BsonElement("attachments")]
    public List<MessageAttachment> Attachments { get; set; } = new();

    [BsonElement("readBy")]
    public List<MessageReadReceipt> ReadBy { get; set; } = new();

    [BsonElement("editedAt")]
    public DateTime? EditedAt { get; set; }

    [BsonElement("deletedAt")]
    public DateTime? DeletedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class MessageAttachment
{
    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("url")]
    public string Url { get; set; } = string.Empty;

    [BsonElement("filename")]
    public string? Filename { get; set; }

    [BsonElement("size")]
    public long? Size { get; set; }
}

[BsonIgnoreExtraElements]
public class MessageReadReceipt
{
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("readAt")]
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
}
