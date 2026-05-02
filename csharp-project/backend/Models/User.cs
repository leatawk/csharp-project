using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ProjectManagement.Api.Models;

[BsonIgnoreExtraElements]
public class User : BaseMongoEntity
{
    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string? Phone { get; set; }

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("emailVerified")]
    public bool EmailVerified { get; set; }

    [BsonElement("phoneVerified")]
    public bool PhoneVerified { get; set; }

    [BsonElement("profile")]
    public UserProfile Profile { get; set; } = new();

    [BsonElement("auth")]
    public UserAuth Auth { get; set; } = new();

    [BsonElement("kyc")]
    public UserKyc Kyc { get; set; } = new();

    [BsonElement("paymentMethods")]
    public List<PaymentMethod> PaymentMethods { get; set; } = new();

    [BsonElement("trustProfile")]
    public TrustProfile TrustProfile { get; set; } = new();

    [BsonElement("wallet")]
    public Wallet Wallet { get; set; } = new();

    [BsonElement("settings")]
    public UserSettings Settings { get; set; } = new();

    [BsonElement("status")]
    public string Status { get; set; } = "active";

    [BsonElement("deletedAt")]
    public DateTime? DeletedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class UserProfile
{
    [BsonElement("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [BsonElement("lastName")]
    public string LastName { get; set; } = string.Empty;

    [BsonElement("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [BsonElement("profilePicture")]
    public string? ProfilePicture { get; set; }

    [BsonElement("preferredLanguage")]
    public string PreferredLanguage { get; set; } = "en";

    [BsonElement("timezone")]
    public string Timezone { get; set; } = "Asia/Beirut";
}

[BsonIgnoreExtraElements]
public class UserAuth
{
    [BsonElement("socialProviders")]
    public List<SocialProvider> SocialProviders { get; set; } = new();

    [BsonElement("mfaEnabled")]
    public bool MfaEnabled { get; set; }

    [BsonElement("mfaMethod")]
    public string? MfaMethod { get; set; }

    [BsonElement("loginAttempts")]
    public int LoginAttempts { get; set; }

    [BsonElement("lockoutUntil")]
    public DateTime? LockoutUntil { get; set; }

    [BsonElement("lastLoginAt")]
    public DateTime? LastLoginAt { get; set; }

    [BsonElement("lastLoginIp")]
    public string? LastLoginIp { get; set; }

    [BsonElement("trustedDevices")]
    public List<TrustedDevice> TrustedDevices { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class SocialProvider
{
    [BsonElement("provider")]
    public string Provider { get; set; } = string.Empty;

    [BsonElement("providerId")]
    public string ProviderId { get; set; } = string.Empty;

    [BsonElement("linkedAt")]
    public DateTime? LinkedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class TrustedDevice
{
    [BsonElement("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [BsonElement("deviceName")]
    public string DeviceName { get; set; } = string.Empty;

    [BsonElement("lastUsed")]
    public DateTime? LastUsed { get; set; }
}

[BsonIgnoreExtraElements]
public class UserKyc
{
    [BsonElement("status")]
    public string Status { get; set; } = "none";

    [BsonElement("level")]
    public int Level { get; set; }

    [BsonElement("documents")]
    public List<KycDocument> Documents { get; set; } = new();

    [BsonElement("verifiedAt")]
    public DateTime? VerifiedAt { get; set; }

    [BsonElement("verifiedBy")]
    public string? VerifiedBy { get; set; }

    [BsonElement("rejectionReason")]
    public string? RejectionReason { get; set; }
}

[BsonIgnoreExtraElements]
public class KycDocument
{
    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("storageRef")]
    public string? StorageRef { get; set; }

    [BsonElement("uploadedAt")]
    public DateTime? UploadedAt { get; set; }

    [BsonElement("verifiedAt")]
    public DateTime? VerifiedAt { get; set; }

    [BsonElement("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}

[BsonIgnoreExtraElements]
public class PaymentMethod
{
    [BsonElement("type")]
    public string Type { get; set; } = string.Empty;

    [BsonElement("isDefault")]
    public bool IsDefault { get; set; }

    [BsonElement("isVerified")]
    public bool IsVerified { get; set; }

    [BsonElement("card")]
    public CardDetails? Card { get; set; }

    [BsonElement("bank")]
    public BankDetails? Bank { get; set; }

    [BsonElement("wallet")]
    public MobileWalletDetails? Wallet { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class CardDetails
{
    [BsonElement("lastFour")]
    public string? LastFour { get; set; }

    [BsonElement("brand")]
    public string? Brand { get; set; }

    [BsonElement("expiryMonth")]
    public int? ExpiryMonth { get; set; }

    [BsonElement("expiryYear")]
    public int? ExpiryYear { get; set; }

    [BsonElement("tokenRef")]
    public string? TokenRef { get; set; }
}

[BsonIgnoreExtraElements]
public class BankDetails
{
    [BsonElement("bankName")]
    public string? BankName { get; set; }

    [BsonElement("accountLastFour")]
    public string? AccountLastFour { get; set; }

    [BsonElement("tokenRef")]
    public string? TokenRef { get; set; }
}

[BsonIgnoreExtraElements]
public class MobileWalletDetails
{
    [BsonElement("provider")]
    public string? Provider { get; set; }

    [BsonElement("identifier")]
    public string? Identifier { get; set; }
}

[BsonIgnoreExtraElements]
public class TrustProfile
{
    [BsonElement("score")]
    public int Score { get; set; } = 50;

    [BsonElement("totalGroupsCompleted")]
    public int TotalGroupsCompleted { get; set; }

    [BsonElement("totalContributionsMade")]
    public int TotalContributionsMade { get; set; }

    [BsonElement("onTimePaymentRate")]
    public decimal OnTimePaymentRate { get; set; }

    [BsonElement("defaultCount")]
    public int DefaultCount { get; set; }

    [BsonElement("averageRating")]
    public decimal? AverageRating { get; set; }

    [BsonElement("ratingsCount")]
    public int RatingsCount { get; set; }

    [BsonElement("memberSince")]
    public DateTime? MemberSince { get; set; }

    [BsonElement("badges")]
    public List<string> Badges { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class Wallet
{
    [BsonElement("balance")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Balance { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("lastUpdated")]
    public DateTime? LastUpdated { get; set; }
}

[BsonIgnoreExtraElements]
public class UserSettings
{
    [BsonElement("notifications")]
    public NotificationSettings Notifications { get; set; } = new();

    [BsonElement("privacy")]
    public PrivacySettings Privacy { get; set; } = new();

    [BsonElement("theme")]
    public string Theme { get; set; } = "light";
}

[BsonIgnoreExtraElements]
public class NotificationSettings
{
    [BsonElement("email")]
    public bool Email { get; set; } = true;

    [BsonElement("push")]
    public bool Push { get; set; } = true;

    [BsonElement("sms")]
    public bool Sms { get; set; }

    [BsonElement("contributionReminders")]
    public bool ContributionReminders { get; set; } = true;

    [BsonElement("payoutAlerts")]
    public bool PayoutAlerts { get; set; } = true;

    [BsonElement("groupUpdates")]
    public bool GroupUpdates { get; set; } = true;
}

[BsonIgnoreExtraElements]
public class PrivacySettings
{
    [BsonElement("showProfile")]
    public bool ShowProfile { get; set; } = true;

    [BsonElement("showTrustScore")]
    public bool ShowTrustScore { get; set; } = true;
}
