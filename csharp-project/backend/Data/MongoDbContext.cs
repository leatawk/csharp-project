using MongoDB.Driver;
using ProjectManagement.Api.Models;

namespace ProjectManagement.Api.Data;

public class MongoDbContext
{
    public MongoDbContext(string connectionString, string databaseName)
    {
        var client = new MongoClient(connectionString);
        Database = client.GetDatabase(databaseName);
    }

    public IMongoDatabase Database { get; }

    public IMongoCollection<User> Users => Database.GetCollection<User>("users");
    public IMongoCollection<RoscaGroup> Groups => Database.GetCollection<RoscaGroup>("roscagroups");
    public IMongoCollection<Membership> Memberships => Database.GetCollection<Membership>("memberships");
    public IMongoCollection<Contribution> Contributions => Database.GetCollection<Contribution>("contributions");
    public IMongoCollection<FundRotation> FundRotations => Database.GetCollection<FundRotation>("fundrotations");
    public IMongoCollection<Message> Messages => Database.GetCollection<Message>("messages");
    public IMongoCollection<Notification> Notifications => Database.GetCollection<Notification>("notifications");
    public IMongoCollection<Dispute> Disputes => Database.GetCollection<Dispute>("disputes");
    public IMongoCollection<AuditLog> AuditLogs => Database.GetCollection<AuditLog>("auditlogs");
}
