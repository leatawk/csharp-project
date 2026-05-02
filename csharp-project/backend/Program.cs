using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Globalization;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;

Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = null;
    o.SerializerOptions.DictionaryKeyPolicy = null;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalFrontend", policy => policy
        .SetIsOriginAllowed(origin =>
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
            return uri.Host == "localhost" || uri.Host == "127.0.0.1";
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();
app.UseCors("LocalFrontend");
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    await next();
});

var mongoUri = Env.Get("MONGODB_URI", Env.Get("MONGO_URI", "mongodb://localhost:27017/projectmanagement"));
var mongoUrl = MongoUrl.Create(mongoUri);
var databaseName = Env.Get("MONGODB_DATABASE", Env.Get("DB_NAME", string.IsNullOrWhiteSpace(mongoUrl.DatabaseName) ? "projectmanagement" : mongoUrl.DatabaseName));
var db = new MongoClient(mongoUri).GetDatabase(databaseName);
var jwt = new JwtService(Env.Get("JWT_SECRET", "development_secret_change_me"), int.TryParse(Env.Get("JWT_EXPIRE_MINUTES", "10080"), out var minutes) ? minutes : 10080);

var users = db.GetCollection<BsonDocument>("users");
var groups = db.GetCollection<BsonDocument>("roscagroups");
var memberships = db.GetCollection<BsonDocument>("memberships");
var contributions = db.GetCollection<BsonDocument>("contributions");
var rotations = db.GetCollection<BsonDocument>("fundrotations");
var notifications = db.GetCollection<BsonDocument>("notifications");
var messages = db.GetCollection<BsonDocument>("messages");
var disputes = db.GetCollection<BsonDocument>("disputes");
var auditlogs = db.GetCollection<BsonDocument>("auditlogs");

app.MapGet("/", () => Api.Ok(new
{
    message = "ROSCA Platform API - ASP.NET Core C#",
    version = "1.0.0",
    endpoints = new
    {
        health = "/api/health",
        auth = "/api/auth",
        users = "/api/users",
        groups = "/api/groups",
        memberships = "/api/memberships",
        contributions = "/api/contributions",
        payouts = "/api/payouts",
        messages = "/api/messages",
        notifications = "/api/notifications",
        disputes = "/api/disputes",
        admin = "/api/admin"
    }
}));

app.MapGet("/api/health", async () =>
{
    try { await db.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1)); }
    catch { return Api.Fail("Database connection failed", 503); }

    return Api.Ok(new
    {
        message = "ROSCA Platform API is running",
        timestamp = DateTime.UtcNow,
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
        database = "Connected"
    });
});

// AUTH
app.MapPost("/api/auth/register", async (HttpContext ctx) =>
{
    var body = await Json.Read(ctx);
    var email = Json.Str(body, "email").Trim().ToLowerInvariant();
    var phone = Json.Str(body, "phone").Trim();
    var password = Json.Str(body, "password");
    var firstName = Json.Str(body, "firstName").Trim();
    var lastName = Json.Str(body, "lastName").Trim();

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
        return Api.Fail("Email, password, first name and last name are required", 400);
    if (password.Length < 8) return Api.Fail("Password must be at least 8 characters long", 400);

    var or = new List<FilterDefinition<BsonDocument>> { Builders<BsonDocument>.Filter.Eq("email", email) };
    if (!string.IsNullOrWhiteSpace(phone)) or.Add(Builders<BsonDocument>.Filter.Eq("phone", phone));
    var existing = await users.Find(Builders<BsonDocument>.Filter.Or(or)).FirstOrDefaultAsync();
    if (existing != null) return Api.Fail("User already exists with this email or phone", 400);

    var now = DateTime.UtcNow;
    var displayName = $"{firstName} {lastName}".Trim();
    var user = new BsonDocument
    {
        ["email"] = email,
        ["phone"] = string.IsNullOrWhiteSpace(phone) ? BsonNull.Value : phone,
        ["passwordHash"] = BCrypt.Net.BCrypt.HashPassword(password),
        ["emailVerified"] = false,
        ["phoneVerified"] = false,
        ["profile"] = new BsonDocument
        {
            ["firstName"] = firstName,
            ["lastName"] = lastName,
            ["displayName"] = displayName,
            ["preferredLanguage"] = Json.Str(body, "preferredLanguage", "en"),
            ["timezone"] = "Asia/Beirut"
        },
        ["auth"] = new BsonDocument
        {
            ["socialProviders"] = new BsonArray(),
            ["mfaEnabled"] = false,
            ["loginAttempts"] = 0,
            ["trustedDevices"] = new BsonArray()
        },
        ["kyc"] = new BsonDocument { ["status"] = "verified", ["level"] = 1, ["documents"] = new BsonArray(), ["verifiedAt"] = now },
        ["paymentMethods"] = new BsonArray(),
        ["trustProfile"] = new BsonDocument
        {
            ["score"] = 50,
            ["totalGroupsCompleted"] = 0,
            ["totalContributionsMade"] = 0,
            ["onTimePaymentRate"] = 0,
            ["defaultCount"] = 0,
            ["ratingsCount"] = 0,
            ["memberSince"] = now,
            ["badges"] = new BsonArray()
        },
        ["wallet"] = new BsonDocument { ["balance"] = Decimal128.Zero, ["currency"] = "USD", ["lastUpdated"] = now },
        ["settings"] = Defaults.UserSettings(),
        ["status"] = "active",
        ["createdAt"] = now,
        ["updatedAt"] = now,
        ["deletedAt"] = BsonNull.Value,
        ["version"] = 0
    };

    await users.InsertOneAsync(user);
    await Audit(auditlogs, user["_id"], "user_registered", "Users", user["_id"]);

    var token = jwt.Generate(user["_id"].ToString());
    var responseUser = Shape.UserSummary(user);
    return Api.Created(new { user = responseUser, token, accessToken = token, refreshToken = token }, "User registered successfully", new { user = responseUser, token, accessToken = token, refreshToken = token });
});

app.MapPost("/api/auth/login", async (HttpContext ctx) =>
{
    var body = await Json.Read(ctx);
    var email = Json.Str(body, "email").Trim().ToLowerInvariant();
    var phone = Json.Str(body, "phone").Trim();
    var password = Json.Str(body, "password");
    if ((string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(phone)) || string.IsNullOrWhiteSpace(password))
        return Api.Fail("Please provide email/phone and password", 400);

    var filters = new List<FilterDefinition<BsonDocument>>();
    if (!string.IsNullOrWhiteSpace(email)) filters.Add(Builders<BsonDocument>.Filter.Eq("email", email));
    if (!string.IsNullOrWhiteSpace(phone)) filters.Add(Builders<BsonDocument>.Filter.Eq("phone", phone));
    var user = await users.Find(Builders<BsonDocument>.Filter.Or(filters)).FirstOrDefaultAsync();
    if (user == null) return Api.Fail("Invalid credentials", 401);

    var status = user.GetValue("status", "active").AsString;
    if (status == "suspended") return Api.Fail("Account suspended. Contact support", 403);
    if (status == "deactivated" || !user.GetValue("deletedAt", BsonNull.Value).IsBsonNull) return Api.Fail("Account has been deactivated", 403);

    var hash = user.GetValue("passwordHash", "").ToString();
    var ok = false;
    try { ok = BCrypt.Net.BCrypt.Verify(password, hash); } catch { ok = password == hash; }
    if (!ok) return Api.Fail("Invalid credentials", 401);

    var update = Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("auth.loginAttempts", 0),
        Builders<BsonDocument>.Update.Set("auth.lastLoginAt", DateTime.UtcNow),
        Builders<BsonDocument>.Update.Set("auth.lastLoginIp", ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown"),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow));
    await users.UpdateOneAsync(Db.IdFilter(user["_id"].ToString()), update);

    var freshUser = await users.Find(Db.IdFilter(user["_id"].ToString())).FirstAsync();
    await Audit(auditlogs, freshUser["_id"], "user_login", "Users", freshUser["_id"]);
    var token = jwt.Generate(freshUser["_id"].ToString());
    var responseUser = Shape.UserSummary(freshUser);
    return Api.Ok(new { user = responseUser, token, accessToken = token, refreshToken = token });
});

app.MapPost("/api/auth/refresh", async (HttpContext ctx) =>
{
    var body = await Json.Read(ctx);
    var refreshToken = Json.Str(body, "refreshToken", Json.Str(body, "token"));
    var userId = jwt.TryGetUserId(refreshToken);
    if (userId == null) return Api.Fail("Invalid or expired refresh token", 403);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    if (user == null) return Api.Fail("User not found", 401);
    return Api.Ok(new { accessToken = jwt.Generate(userId) });
});

app.MapGet("/api/auth/me", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    return user == null ? Api.Fail("User not found", 404) : Api.Ok(Shape.Doc(user));
});

app.MapPost("/api/auth/logout", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId != null) await Audit(auditlogs, Db.IdValue(userId), "user_logout", "Users", Db.IdValue(userId));
    return Api.Ok(new { }, "Logged out successfully");
});

app.MapPut("/api/auth/updatepassword", ChangePassword);
app.MapPut("/api/users/change-password", ChangePassword);

async Task<IResult> ChangePassword(HttpContext ctx)
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var currentPassword = Json.Str(body, "currentPassword");
    var newPassword = Json.Str(body, "newPassword");
    if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword)) return Api.Fail("Please provide current and new password", 400);
    if (newPassword.Length < 8) return Api.Fail("New password must be at least 8 characters long", 400);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    if (user == null) return Api.Fail("User not found", 404);
    var hash = user.GetValue("passwordHash", "").ToString();
    var ok = false;
    try { ok = BCrypt.Net.BCrypt.Verify(currentPassword, hash); } catch { ok = currentPassword == hash; }
    if (!ok) return Api.Fail("Current password is incorrect", 401);
    await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("passwordHash", BCrypt.Net.BCrypt.HashPassword(newPassword)),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    var token = jwt.Generate(userId);
    return Api.Ok(new { token, accessToken = token, refreshToken = token }, "Password updated successfully");
}

app.MapPut("/api/auth/verify-email", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("emailVerified", true),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    return Api.Ok(new { }, "Email verified successfully");
});

// USERS
app.MapGet("/api/users/profile", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    return user == null ? Api.Fail("User not found", 404) : Api.Ok(Shape.Doc(user));
});

app.MapPut("/api/users/profile", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var updates = new List<UpdateDefinition<BsonDocument>> { Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow) };
    foreach (var key in new[] { "firstName", "lastName", "displayName", "profilePicture", "preferredLanguage", "timezone" })
    {
        if (body.TryGetProperty(key, out var prop) && prop.ValueKind != JsonValueKind.Null) updates.Add(Builders<BsonDocument>.Update.Set($"profile.{key}", Json.Any(prop)));
    }
    await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(updates));
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    return Api.Ok(Shape.Doc(user), "Profile updated successfully");
});

app.MapGet("/api/users/payment-methods", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    var methods = user?.GetValue("paymentMethods", new BsonArray()).AsBsonArray ?? new BsonArray();
    return Api.Ok(new { paymentMethods = Shape.Array(methods) });
});

app.MapPost("/api/users/payment-methods", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var type = Json.Str(body, "type", "card");
    var now = DateTime.UtcNow;
    var method = new BsonDocument
    {
        ["_id"] = ObjectId.GenerateNewId(),
        ["type"] = type,
        ["isDefault"] = Json.Bool(body, "isDefault", false),
        ["isVerified"] = true,
        ["createdAt"] = now
    };
    if (body.TryGetProperty("card", out var card) && card.ValueKind == JsonValueKind.Object) method["card"] = Json.ToBson(card).AsBsonDocument;
    if (body.TryGetProperty("bank", out var bank) && bank.ValueKind == JsonValueKind.Object) method["bank"] = Json.ToBson(bank).AsBsonDocument;
    if (body.TryGetProperty("wallet", out var wallet) && wallet.ValueKind == JsonValueKind.Object) method["wallet"] = Json.ToBson(wallet).AsBsonDocument;

    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    var existing = user?.GetValue("paymentMethods", new BsonArray()).AsBsonArray ?? new BsonArray();
    if (existing.Count == 0) method["isDefault"] = true;
    if (method["isDefault"].AsBoolean)
    {
        foreach (var m in existing.OfType<BsonDocument>()) m["isDefault"] = false;
        existing.Add(method);
        await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(
            Builders<BsonDocument>.Update.Set("paymentMethods", existing),
            Builders<BsonDocument>.Update.Set("updatedAt", now)));
    }
    else
    {
        await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(
            Builders<BsonDocument>.Update.Push("paymentMethods", method),
            Builders<BsonDocument>.Update.Set("updatedAt", now)));
    }

    var fresh = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    return Api.Created(new { paymentMethods = Shape.Array(fresh.GetValue("paymentMethods", new BsonArray()).AsBsonArray) }, "Payment method added successfully");
});

app.MapDelete("/api/users/payment-methods/{methodId}", async (HttpContext ctx, string methodId) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    if (user == null) return Api.Fail("User not found", 404);
    var methods = user.GetValue("paymentMethods", new BsonArray()).AsBsonArray;
    var remaining = new BsonArray(methods.Where(v => v is BsonDocument d && d.GetValue("_id", "").ToString() != methodId));
    if (remaining.Count > 0 && !remaining.OfType<BsonDocument>().Any(m => m.GetValue("isDefault", false).ToBoolean())) remaining[0].AsBsonDocument["isDefault"] = true;
    await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("paymentMethods", remaining),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    return Api.Ok(new { paymentMethods = Shape.Array(remaining) }, "Payment method removed successfully");
});

app.MapGet("/api/users/balance", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var userVal = Db.IdValue(userId);
    var paid = await contributions.Find(Builders<BsonDocument>.Filter.Eq("userId", userVal) & Builders<BsonDocument>.Filter.In("status", new[] { "completed", "completed_late" })).ToListAsync();
    var pending = await contributions.Find(Builders<BsonDocument>.Filter.Eq("userId", userVal) & Builders<BsonDocument>.Filter.In("status", new[] { "pending", "scheduled", "late" })).ToListAsync();
    decimal totalContributed = paid.Sum(c => Shape.DecimalAt(c, "amount.paid", Shape.DecimalAt(c, "amount.expected", 0)));
    decimal totalPending = pending.Sum(c => Shape.DecimalAt(c, "amount.expected", 0));
    var payouts = await rotations.Find(Builders<BsonDocument>.Filter.Eq("recipient.userId", userVal) & Builders<BsonDocument>.Filter.Eq("payout.status", "completed")).ToListAsync();
    decimal totalReceived = payouts.Sum(r => Shape.DecimalAt(r, "amounts.netPayout", 0));
    return Api.Ok(new { totalContributed, totalPending, totalReceived, balance = totalReceived - totalContributed });
});

app.MapPut("/api/users/settings/notifications", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var updates = new List<UpdateDefinition<BsonDocument>>();
    foreach (var key in new[] { "email", "push", "sms", "contributionReminders", "payoutAlerts", "groupUpdates" })
        if (body.TryGetProperty(key, out var v) && v.ValueKind is JsonValueKind.True or JsonValueKind.False) updates.Add(Builders<BsonDocument>.Update.Set($"settings.notifications.{key}", v.GetBoolean()));
    if (updates.Count == 0) return Api.Fail("No settings provided", 400);
    await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(updates));
    var user = await users.Find(Db.IdFilter(userId)).FirstAsync();
    return Api.Ok(Shape.Doc(user["settings"].AsBsonDocument["notifications"].AsBsonDocument), "Notification settings updated successfully");
});

app.MapGet("/api/users/{id}/trust-profile", async (string id) =>
{
    var user = await users.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    return user == null ? Api.Fail("User not found", 404) : Api.Ok(Shape.Doc(user.GetValue("trustProfile", new BsonDocument()).AsBsonDocument));
});

app.MapGet("/api/users/{id}", async (string id) =>
{
    var user = await users.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    return user == null ? Api.Fail("User not found", 404) : Api.Ok(Shape.Doc(user));
});

app.MapDelete("/api/users/account", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    await users.UpdateOneAsync(Db.IdFilter(userId), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("status", "deactivated"),
        Builders<BsonDocument>.Update.Set("deletedAt", DateTime.UtcNow)));
    return Api.Ok(new { }, "Account deleted successfully");
});

// GROUPS
app.MapGet("/api/groups", async (HttpContext ctx) =>
{
    var q = ctx.Request.Query;
    var filter = Builders<BsonDocument>.Filter.Eq("visibility", "public") & (Builders<BsonDocument>.Filter.Eq("deletedAt", BsonNull.Value) | Builders<BsonDocument>.Filter.Exists("deletedAt", false));
    if (q.TryGetValue("status", out var status) && !string.IsNullOrWhiteSpace(status.ToString())) filter &= Builders<BsonDocument>.Filter.Eq("state.status", status.ToString());
    if (q.TryGetValue("currency", out var currency) && !string.IsNullOrWhiteSpace(currency.ToString())) filter &= Builders<BsonDocument>.Filter.Eq("config.currency", currency.ToString());
    if (q.TryGetValue("frequency", out var freq) && !string.IsNullOrWhiteSpace(freq.ToString())) filter &= Builders<BsonDocument>.Filter.Eq("config.frequency", freq.ToString());
    if (q.TryGetValue("search", out var search) && !string.IsNullOrWhiteSpace(search.ToString()))
    {
        var regex = new BsonRegularExpression(search.ToString(), "i");
        filter &= Builders<BsonDocument>.Filter.Or(Builders<BsonDocument>.Filter.Regex("name", regex), Builders<BsonDocument>.Filter.Regex("description", regex));
    }
    var docs = await groups.Find(filter).Sort(Builders<BsonDocument>.Sort.Descending("createdAt")).Limit(50).ToListAsync();
    var shaped = docs.Select(Shape.Group).ToList();
    return Api.Ok(new { groups = shaped, items = shaped }, extra: new Dictionary<string, object> { ["count"] = shaped.Count });
});

app.MapGet("/api/groups/my/all", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var userVal = Db.IdValue(userId);
    var memberDocs = await memberships.Find(Builders<BsonDocument>.Filter.Eq("userId", userVal) & Builders<BsonDocument>.Filter.In("status", new[] { "active", "pending_approval" })).ToListAsync();
    var groupIds = memberDocs.Select(m => m.GetValue("groupId", BsonNull.Value)).Where(v => !v.IsBsonNull).Distinct().ToList();
    var docs = groupIds.Count == 0 ? new List<BsonDocument>() : await groups.Find(Builders<BsonDocument>.Filter.In("_id", groupIds)).ToListAsync();
    var shaped = docs.Select(g =>
    {
        var m = memberDocs.FirstOrDefault(x => x.GetValue("groupId", BsonNull.Value) == g["_id"]);
        var d = Shape.Group(g);
        d["membership"] = m == null ? null : Shape.Doc(m);
        d["group"] = Shape.Group(g);
        return d;
    }).ToList();
    return Api.Ok(new { groups = shaped, items = shaped }, extra: new Dictionary<string, object> { ["count"] = shaped.Count });
});

app.MapGet("/api/groups/{id}", async (string id) =>
{
    var group = await groups.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    if (group == null || (!group.GetValue("deletedAt", BsonNull.Value).IsBsonNull)) return Api.Fail("Group not found", 404);
    return Api.Ok(new { group = Shape.Group(group) });
});

app.MapPost("/api/groups", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    if (user == null) return Api.Fail("User not found", 404);
    var body = await Json.Read(ctx);
    var name = Json.Str(body, "name").Trim();
    if (string.IsNullOrWhiteSpace(name)) return Api.Fail("Group name is required", 400);
    var amount = Json.Dec(body, "contributionAmount", 0);
    var totalSlots = Json.Int(body, "totalSlots", 2);
    var now = DateTime.UtcNow;
    var group = new BsonDocument
    {
        ["name"] = name,
        ["description"] = Json.Str(body, "description"),
        ["createdBy"] = Db.IdValue(userId),
        ["config"] = new BsonDocument
        {
            ["contributionAmount"] = Money.D128(amount),
            ["currency"] = Json.Str(body, "currency", "USD"),
            ["frequency"] = Json.Str(body, "frequency", "monthly"),
            ["totalSlots"] = totalSlots,
            ["duration"] = Json.Int(body, "duration", totalSlots),
            ["payoutMethod"] = Json.Str(body, "payoutMethod", "fixed"),
            ["payoutOrder"] = new BsonArray(),
            ["gracePeriodDays"] = Json.Int(body, "gracePeriodDays", 3),
            ["latePenaltyPercent"] = Json.Dec(body, "latePenaltyPercent", 0),
            ["allowEarlyPayout"] = Json.Bool(body, "allowEarlyPayout", false),
            ["requireGuarantor"] = Json.Bool(body, "requireGuarantor", false),
            ["allowMidCycleJoin"] = Json.Bool(body, "allowMidCycleJoin", false),
            ["startCondition"] = Json.Str(body, "startCondition", "when_full")
        },
        ["state"] = new BsonDocument
        {
            ["status"] = "forming",
            ["currentCycle"] = 0,
            ["filledSlots"] = 1,
            ["totalCollected"] = Decimal128.Zero,
            ["poolBalance"] = Decimal128.Zero,
            ["formingStartedAt"] = now
        },
        ["memberSummary"] = new BsonArray(),
        ["visibility"] = Json.Str(body, "visibility", "public"),
        ["inviteCode"] = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
        ["tags"] = Json.ArrayOrEmpty(body, "tags"),
        ["guaranteePool"] = new BsonDocument { ["enabled"] = false, ["balance"] = Decimal128.Zero },
        ["createdAt"] = now,
        ["updatedAt"] = now,
        ["deletedAt"] = BsonNull.Value,
        ["version"] = 0
    };
    await groups.InsertOneAsync(group);
    var membership = new BsonDocument
    {
        ["userId"] = Db.IdValue(userId),
        ["groupId"] = group["_id"],
        ["role"] = "admin",
        ["slotNumber"] = 1,
        ["status"] = "active",
        ["joinedAt"] = now,
        ["approvedBy"] = Db.IdValue(userId),
        ["contributionStats"] = Defaults.ContributionStats(),
        ["payoutInfo"] = new BsonDocument { ["hasReceived"] = false },
        ["groupTrust"] = new BsonDocument { ["ratingsReceived"] = 0 },
        ["createdAt"] = now,
        ["updatedAt"] = now,
        ["version"] = 0
    };
    await memberships.InsertOneAsync(membership);
    var display = Shape.DisplayName(user);
    var summary = new BsonDocument { ["memberId"] = membership["_id"], ["userId"] = Db.IdValue(userId), ["displayName"] = display, ["role"] = "admin", ["slotNumber"] = 1, ["hasReceivedPayout"] = false, ["contributionStatus"] = "current" };
    await groups.UpdateOneAsync(Db.IdFilter(group["_id"].ToString()), Builders<BsonDocument>.Update.Push("memberSummary", summary));
    var fresh = await groups.Find(Db.IdFilter(group["_id"].ToString())).FirstAsync();
    await Audit(auditlogs, Db.IdValue(userId), "group_created", "RoscaGroups", fresh["_id"], fresh["_id"]);
    return Api.Created(new { group = Shape.Group(fresh), membership = Shape.Doc(membership) }, "Group created successfully");
});

app.MapPut("/api/groups/{id}", async (HttpContext ctx, string id) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var updates = new List<UpdateDefinition<BsonDocument>> { Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow) };
    if (body.TryGetProperty("name", out var name)) updates.Add(Builders<BsonDocument>.Update.Set("name", Json.Any(name)));
    if (body.TryGetProperty("description", out var desc)) updates.Add(Builders<BsonDocument>.Update.Set("description", Json.Any(desc)));
    if (body.TryGetProperty("gracePeriodDays", out var grace)) updates.Add(Builders<BsonDocument>.Update.Set("config.gracePeriodDays", Json.Any(grace)));
    if (body.TryGetProperty("latePenaltyPercent", out var late)) updates.Add(Builders<BsonDocument>.Update.Set("config.latePenaltyPercent", Json.Any(late)));
    await groups.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(updates));
    var group = await groups.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    return group == null ? Api.Fail("Group not found", 404) : Api.Ok(new { group = Shape.Group(group) }, "Group updated successfully");
});

app.MapDelete("/api/groups/{id}", async (HttpContext ctx, string id) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    await groups.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("deletedAt", DateTime.UtcNow),
        Builders<BsonDocument>.Update.Set("state.status", "dissolved")));
    return Api.Ok(new { }, "Group deleted successfully");
});

// MEMBERSHIPS
app.MapGet("/api/memberships/group/{groupId}", async (string groupId) =>
{
    var groupVal = Db.IdValue(groupId);
    var memberDocs = await memberships.Find(Builders<BsonDocument>.Filter.Eq("groupId", groupVal)).Sort(Builders<BsonDocument>.Sort.Ascending("slotNumber")).ToListAsync();
    var shaped = new List<Dictionary<string, object>>();
    foreach (var m in memberDocs)
    {
        var d = Shape.Doc(m);
        var uid = m.GetValue("userId", BsonNull.Value);
        var u = uid.IsBsonNull ? null : await users.Find(Builders<BsonDocument>.Filter.Eq("_id", uid)).FirstOrDefaultAsync();
        d["userId"] = u == null ? Shape.Doc(new BsonDocument { ["_id"] = uid, ["firstName"] = "Unknown", ["lastName"] = "User" }) : Shape.UserSummary(u);
        shaped.Add(d);
    }
    return Api.Ok(new { memberships = shaped, members = shaped }, extra: new Dictionary<string, object> { ["count"] = shaped.Count });
});

app.MapPost("/api/memberships/join/{groupId}", async (HttpContext ctx, string groupId) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var user = await users.Find(Db.IdFilter(userId)).FirstOrDefaultAsync();
    var group = await groups.Find(Db.IdFilter(groupId)).FirstOrDefaultAsync();
    if (group == null) return Api.Fail("Group not found", 404);
    var userVal = Db.IdValue(userId); var groupVal = group["_id"];
    var existing = await memberships.Find(Builders<BsonDocument>.Filter.Eq("userId", userVal) & Builders<BsonDocument>.Filter.Eq("groupId", groupVal)).FirstOrDefaultAsync();
    if (existing != null) return Api.Ok(new { membership = Shape.Doc(existing) }, "Already joined this group");
    var count = await memberships.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("groupId", groupVal));
    var totalSlots = Shape.IntAt(group, "config.totalSlots", 50);
    if (count >= totalSlots) return Api.Fail("Group is full", 400);
    var now = DateTime.UtcNow;
    var membership = new BsonDocument
    {
        ["userId"] = userVal,
        ["groupId"] = groupVal,
        ["role"] = "member",
        ["slotNumber"] = (int)count + 1,
        ["status"] = "active",
        ["joinedAt"] = now,
        ["contributionStats"] = Defaults.ContributionStats(),
        ["payoutInfo"] = new BsonDocument { ["hasReceived"] = false },
        ["groupTrust"] = new BsonDocument { ["ratingsReceived"] = 0 },
        ["createdAt"] = now,
        ["updatedAt"] = now,
        ["version"] = 0
    };
    await memberships.InsertOneAsync(membership);
    var summary = new BsonDocument { ["memberId"] = membership["_id"], ["userId"] = userVal, ["displayName"] = Shape.DisplayName(user), ["role"] = "member", ["slotNumber"] = membership["slotNumber"], ["hasReceivedPayout"] = false, ["contributionStatus"] = "current" };
    await groups.UpdateOneAsync(Db.IdFilter(groupId), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Push("memberSummary", summary),
        Builders<BsonDocument>.Update.Set("state.filledSlots", (int)count + 1),
        Builders<BsonDocument>.Update.Set("updatedAt", now)));
    return Api.Created(new { membership = Shape.Doc(membership) }, "Join request submitted successfully");
});

app.MapPut("/api/memberships/{id}/approve", async (string id) => await MembershipStatus(id, "active", "Membership approved"));
app.MapPut("/api/memberships/{id}/reject", async (string id) => await MembershipStatus(id, "removed", "Membership rejected"));
app.MapDelete("/api/memberships/{id}/leave", async (string id) => await MembershipStatus(id, "withdrawn", "Left group successfully"));
app.MapDelete("/api/memberships/{id}/remove", async (string id) => await MembershipStatus(id, "removed", "Member removed successfully"));
app.MapPost("/api/memberships/{id}/rate", async (string id) => await MembershipStatus(id, "active", "Rating saved"));

async Task<IResult> MembershipStatus(string id, string status, string message)
{
    await memberships.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("status", status),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    var m = await memberships.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    return m == null ? Api.Fail("Membership not found", 404) : Api.Ok(new { membership = Shape.Doc(m) }, message);
}

// CONTRIBUTIONS
app.MapGet("/api/contributions/my", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await contributions.Find(Builders<BsonDocument>.Filter.Eq("userId", Db.IdValue(userId))).Sort(Builders<BsonDocument>.Sort.Descending("dueDate")).ToListAsync();
    var shaped = new List<Dictionary<string, object>>();
    foreach (var c in docs) shaped.Add(await Shape.Contribution(c, groups));
    return Api.Ok(new { contributions = shaped, items = shaped }, extra: new Dictionary<string, object> { ["count"] = shaped.Count });
});

app.MapGet("/api/contributions/{id}", async (string id) =>
{
    var c = await contributions.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    if (c == null) return Api.Fail("Contribution not found", 404);
    return Api.Ok(new { contribution = await Shape.Contribution(c, groups) });
});

app.MapPost("/api/contributions", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var now = DateTime.UtcNow;
    var expected = Json.Dec(body, "amount", Json.Dec(body, "expected", 0));
    var doc = new BsonDocument
    {
        ["idempotencyKey"] = Guid.NewGuid().ToString("N"),
        ["groupId"] = Db.IdValue(Json.Str(body, "groupId")),
        ["membershipId"] = Db.IdValue(Json.Str(body, "membershipId")),
        ["userId"] = Db.IdValue(userId),
        ["cycleNumber"] = Json.Int(body, "cycleNumber", 1),
        ["amount"] = new BsonDocument { ["expected"] = Money.D128(expected), ["paid"] = Decimal128.Zero, ["penalty"] = Decimal128.Zero, ["guaranteeContribution"] = Decimal128.Zero, ["net"] = Money.D128(expected) },
        ["currency"] = Json.Str(body, "currency", "USD"),
        ["dueDate"] = now.AddDays(7),
        ["gracePeriodEnds"] = now.AddDays(10),
        ["status"] = "pending",
        ["payment"] = new BsonDocument { ["retryCount"] = 0 },
        ["isAutoDebit"] = false,
        ["isManualOverride"] = false,
        ["createdAt"] = now,
        ["updatedAt"] = now,
        ["version"] = 0,
        ["statusHistory"] = new BsonArray()
    };
    await contributions.InsertOneAsync(doc);
    return Api.Created(new { contribution = await Shape.Contribution(doc, groups) }, "Contribution created successfully");
});

app.MapPost("/api/contributions/{id}/pay", async (HttpContext ctx, string id) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var c = await contributions.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    if (c == null && id == "contribute") return Api.Fail("Contribution ID is required", 400);
    if (c == null) return Api.Fail("Contribution not found", 404);
    var now = DateTime.UtcNow;
    var expected = Shape.DecimalAt(c, "amount.expected", 0);
    var penalty = Shape.DecimalAt(c, "amount.penalty", 0);
    var status = c.GetValue("gracePeriodEnds", now).ToUniversalTime() < now ? "completed_late" : "completed";
    var update = Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("status", status),
        Builders<BsonDocument>.Update.Set("paidAt", now),
        Builders<BsonDocument>.Update.Set("amount.paid", Money.D128(expected + penalty)),
        Builders<BsonDocument>.Update.Set("payment.paymentMethodId", Db.IdValue(Json.Str(body, "paymentMethodId", ObjectId.GenerateNewId().ToString()))),
        Builders<BsonDocument>.Update.Set("payment.processorName", "local-demo"),
        Builders<BsonDocument>.Update.Set("payment.processorTransactionId", Guid.NewGuid().ToString("N")),
        Builders<BsonDocument>.Update.Set("updatedAt", now),
        Builders<BsonDocument>.Update.Push("statusHistory", new BsonDocument { ["status"] = status, ["changedAt"] = now, ["changedBy"] = Db.IdValue(userId), ["reason"] = "paid" }));
    await contributions.UpdateOneAsync(Db.IdFilter(id), update);
    var fresh = await contributions.Find(Db.IdFilter(id)).FirstAsync();
    return Api.Ok(new { contribution = await Shape.Contribution(fresh, groups) }, "Payment processed successfully");
});

app.MapPost("/api/contributions/contribute", async () => Api.Fail("Use /api/contributions/{id}/pay with a contribution ID", 400));

app.MapGet("/api/contributions/group/{groupId}/cycle/{cycleNumber:int}", async (string groupId, int cycleNumber) =>
{
    var docs = await contributions.Find(Builders<BsonDocument>.Filter.Eq("groupId", Db.IdValue(groupId)) & Builders<BsonDocument>.Filter.Eq("cycleNumber", cycleNumber)).ToListAsync();
    return Api.Ok(new { contributions = docs.Select(Shape.Doc).ToList() });
});
app.MapGet("/api/contributions/history", async (HttpContext ctx) => await MyContributionSummary(ctx, includeItems: true));
app.MapGet("/api/contributions/summary", async (HttpContext ctx) => await MyContributionSummary(ctx, includeItems: false));
app.MapGet("/api/contributions/due", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await contributions.Find(Builders<BsonDocument>.Filter.Eq("userId", Db.IdValue(userId)) & Builders<BsonDocument>.Filter.In("status", new[] { "pending", "scheduled", "late" })).ToListAsync();
    return Api.Ok(new { contributions = docs.Select(Shape.Doc).ToList() });
});
app.MapPost("/api/contributions/enable-autopay", () => Api.Ok(new { }, "Auto payment enabled"));
app.MapPut("/api/contributions/{id}/override", async (string id) =>
{
    await contributions.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("isManualOverride", true),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    return Api.Ok(new { }, "Contribution override saved");
});

async Task<IResult> MyContributionSummary(HttpContext ctx, bool includeItems)
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await contributions.Find(Builders<BsonDocument>.Filter.Eq("userId", Db.IdValue(userId))).ToListAsync();
    var completed = docs.Where(c => new[] { "completed", "completed_late" }.Contains(c.GetValue("status", "").ToString())).ToList();
    var pending = docs.Where(c => new[] { "pending", "scheduled", "late" }.Contains(c.GetValue("status", "").ToString())).ToList();
    var data = new Dictionary<string, object>
    {
        ["total"] = docs.Count,
        ["completed"] = completed.Count,
        ["pending"] = pending.Count,
        ["totalPaid"] = completed.Sum(c => Shape.DecimalAt(c, "amount.paid", 0)),
        ["totalPending"] = pending.Sum(c => Shape.DecimalAt(c, "amount.expected", 0))
    };
    if (includeItems) data["contributions"] = docs.Select(Shape.Doc).ToList();
    return Api.Ok(data);
}

// PAYOUTS
app.MapGet("/api/payouts/my", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await rotations.Find(Builders<BsonDocument>.Filter.Eq("recipient.userId", Db.IdValue(userId))).Sort(Builders<BsonDocument>.Sort.Descending("createdAt")).ToListAsync();
    return Api.Ok(new { payouts = docs.Select(Shape.Doc).ToList(), rotations = docs.Select(Shape.Doc).ToList() });
});
app.MapGet("/api/payouts", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await rotations.Find(Builders<BsonDocument>.Filter.Eq("recipient.userId", Db.IdValue(userId))).ToListAsync();
    return Api.Ok(new { payouts = docs.Select(Shape.Doc).ToList() });
});
app.MapGet("/api/payouts/group/{groupId}", async (string groupId) =>
{
    var docs = await rotations.Find(Builders<BsonDocument>.Filter.Eq("groupId", Db.IdValue(groupId))).ToListAsync();
    return Api.Ok(new { payouts = docs.Select(Shape.Doc).ToList(), rotations = docs.Select(Shape.Doc).ToList() });
});
app.MapPost("/api/payouts/rotations", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var now = DateTime.UtcNow;
    var doc = new BsonDocument
    {
        ["groupId"] = Db.IdValue(Json.Str(body, "groupId")),
        ["cycleNumber"] = Json.Int(body, "cycleNumber", 1),
        ["recipient"] = new BsonDocument { ["userId"] = Db.IdValue(userId), ["selectionMethod"] = "manual", ["selectedAt"] = now },
        ["amounts"] = new BsonDocument { ["grossPool"] = Decimal128.Zero, ["netPayout"] = Decimal128.Zero, ["currency"] = "USD" },
        ["schedule"] = new BsonDocument { ["collectionStartDate"] = now, ["collectionEndDate"] = now.AddDays(7), ["payoutDueDate"] = now.AddDays(8) },
        ["status"] = "scheduled",
        ["payout"] = new BsonDocument { ["status"] = "pending" },
        ["createdAt"] = now,
        ["updatedAt"] = now,
        ["version"] = 0
    };
    await rotations.InsertOneAsync(doc);
    return Api.Created(new { rotation = Shape.Doc(doc) }, "Fund rotation created");
});
app.MapPost("/api/payouts/select-recipient/{groupId}", (string groupId) => Api.Ok(new { groupId }, "Recipient selected"));
app.MapPost("/api/payouts/rotations/{id}/execute", async (string id) =>
{
    await rotations.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("payout.status", "completed"),
        Builders<BsonDocument>.Update.Set("status", "completed"),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    var doc = await rotations.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    return doc == null ? Api.Fail("Rotation not found", 404) : Api.Ok(new { rotation = Shape.Doc(doc) }, "Payout executed");
});
app.MapPost("/api/payouts/rotations/{id}/bid", (string id) => Api.Ok(new { rotationId = id }, "Bid submitted"));
app.MapGet("/api/payouts/group/{groupId}/progress", (string groupId) => Api.Ok(new { groupId, progress = 0 }));

// NOTIFICATIONS
app.MapGet("/api/notifications", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await notifications.Find(Builders<BsonDocument>.Filter.Eq("userId", Db.IdValue(userId))).Sort(Builders<BsonDocument>.Sort.Descending("createdAt")).Limit(50).ToListAsync();
    return Api.Ok(new { notifications = docs.Select(Shape.Doc).ToList() });
});
app.MapPut("/api/notifications/mark-all-read", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    await notifications.UpdateManyAsync(Builders<BsonDocument>.Filter.Eq("userId", Db.IdValue(userId)), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("readStatus", true),
        Builders<BsonDocument>.Update.Set("readAt", DateTime.UtcNow)));
    return Api.Ok(new { }, "Notifications marked as read");
});
app.MapPut("/api/notifications/{id}/read", async (string id) =>
{
    await notifications.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("readStatus", true),
        Builders<BsonDocument>.Update.Set("readAt", DateTime.UtcNow)));
    return Api.Ok(new { }, "Notification marked as read");
});
app.MapPost("/api/notifications", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var doc = new BsonDocument
    {
        ["userId"] = Db.IdValue(userId),
        ["type"] = Json.Str(body, "type", "system"),
        ["title"] = Json.Str(body, "title", "Notification"),
        ["message"] = Json.Str(body, "message", ""),
        ["readStatus"] = false,
        ["priority"] = Json.Str(body, "priority", "normal"),
        ["createdAt"] = DateTime.UtcNow
    };
    await notifications.InsertOneAsync(doc);
    return Api.Created(new { notification = Shape.Doc(doc) }, "Notification created");
});
app.MapDelete("/api/notifications/{id}", async (string id) =>
{
    await notifications.DeleteOneAsync(Db.IdFilter(id));
    return Api.Ok(new { }, "Notification deleted");
});

// MESSAGES
app.MapGet("/api/messages/group/{groupId}", async (string groupId) =>
{
    var docs = await messages.Find(Builders<BsonDocument>.Filter.Eq("groupId", Db.IdValue(groupId)) & (Builders<BsonDocument>.Filter.Eq("deleted", false) | Builders<BsonDocument>.Filter.Exists("deleted", false))).Sort(Builders<BsonDocument>.Sort.Ascending("createdAt")).ToListAsync();
    return Api.Ok(new { messages = docs.Select(Shape.Doc).ToList() });
});
app.MapPost("/api/messages/group/{groupId}", async (HttpContext ctx, string groupId) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var doc = new BsonDocument
    {
        ["groupId"] = Db.IdValue(groupId),
        ["senderId"] = Db.IdValue(userId),
        ["type"] = Json.Str(body, "type", "text"),
        ["content"] = Json.Str(body, "content", Json.Str(body, "text")),
        ["readBy"] = new BsonArray(),
        ["deleted"] = false,
        ["createdAt"] = DateTime.UtcNow,
        ["updatedAt"] = DateTime.UtcNow
    };
    await messages.InsertOneAsync(doc);
    return Api.Created(new { message = Shape.Doc(doc) }, "Message sent");
});
app.MapDelete("/api/messages/{id}", async (string id) =>
{
    await messages.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Set("deleted", true));
    return Api.Ok(new { }, "Message deleted");
});
app.MapGet("/api/messages/unread/count", () => Api.Ok(new { count = 0 }));

// DISPUTES
app.MapGet("/api/disputes/my", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var docs = await disputes.Find(Builders<BsonDocument>.Filter.Eq("raisedBy", Db.IdValue(userId))).ToListAsync();
    return Api.Ok(new { disputes = docs.Select(Shape.Doc).ToList() });
});
app.MapGet("/api/disputes/group/{groupId}", async (string groupId) =>
{
    var docs = await disputes.Find(Builders<BsonDocument>.Filter.Eq("groupId", Db.IdValue(groupId))).ToListAsync();
    return Api.Ok(new { disputes = docs.Select(Shape.Doc).ToList() });
});
app.MapGet("/api/disputes/{id}", async (string id) =>
{
    var doc = await disputes.Find(Db.IdFilter(id)).FirstOrDefaultAsync();
    return doc == null ? Api.Fail("Dispute not found", 404) : Api.Ok(new { dispute = Shape.Doc(doc) });
});
app.MapPost("/api/disputes", async (HttpContext ctx) =>
{
    var userId = Auth.UserId(ctx, jwt);
    if (userId == null) return Api.Fail("Unauthorized", 401);
    var body = await Json.Read(ctx);
    var doc = new BsonDocument
    {
        ["groupId"] = Db.IdValue(Json.Str(body, "groupId")),
        ["raisedBy"] = Db.IdValue(userId),
        ["type"] = Json.Str(body, "type", "other"),
        ["title"] = Json.Str(body, "title", "Dispute"),
        ["description"] = Json.Str(body, "description"),
        ["status"] = "open",
        ["messages"] = new BsonArray(),
        ["evidence"] = new BsonArray(),
        ["createdAt"] = DateTime.UtcNow,
        ["updatedAt"] = DateTime.UtcNow,
        ["version"] = 0
    };
    await disputes.InsertOneAsync(doc);
    return Api.Created(new { dispute = Shape.Doc(doc) }, "Dispute filed successfully");
});
app.MapPost("/api/disputes/{id}/evidence", async (HttpContext ctx, string id) =>
{
    var body = await Json.Read(ctx);
    var evidence = Json.ToBson(body);
    await disputes.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Push("evidence", evidence));
    return Api.Ok(new { }, "Evidence submitted");
});
app.MapPost("/api/disputes/{id}/messages", async (HttpContext ctx, string id) =>
{
    var userId = Auth.UserId(ctx, jwt);
    var body = await Json.Read(ctx);
    var msg = new BsonDocument { ["senderId"] = userId == null ? BsonNull.Value : Db.IdValue(userId), ["senderRole"] = "user", ["content"] = Json.Str(body, "content", Json.Str(body, "message")), ["createdAt"] = DateTime.UtcNow };
    await disputes.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Push("messages", msg));
    return Api.Ok(new { }, "Message sent");
});
app.MapPut("/api/disputes/{id}/review", async (string id) => await DisputeStatus(id, "under_review", "Dispute under review"));
app.MapPut("/api/disputes/{id}/resolve", async (string id) => await DisputeStatus(id, "resolved", "Dispute resolved"));
app.MapPut("/api/disputes/{id}/escalate", async (string id) => await DisputeStatus(id, "escalated", "Dispute escalated"));

async Task<IResult> DisputeStatus(string id, string status, string msg)
{
    await disputes.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("status", status),
        Builders<BsonDocument>.Update.Set("updatedAt", DateTime.UtcNow)));
    return Api.Ok(new { }, msg);
}

// ADMIN
app.MapGet("/api/admin/stats", async () =>
{
    var userCount = await users.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
    var groupCount = await groups.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
    var contributionCount = await contributions.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
    var payoutCount = await rotations.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
    return Api.Ok(new { users = userCount, groups = groupCount, contributions = contributionCount, payouts = payoutCount });
});
app.MapGet("/api/admin/users", async () =>
{
    var docs = await users.Find(Builders<BsonDocument>.Filter.Empty).Sort(Builders<BsonDocument>.Sort.Descending("createdAt")).Limit(200).ToListAsync();
    return Api.Ok(new { users = docs.Select(Shape.Doc).ToList() });
});
app.MapPut("/api/admin/users/{id}/suspend", async (string id) =>
{
    await users.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Set("status", "suspended"));
    return Api.Ok(new { }, "User suspended");
});
app.MapPut("/api/admin/users/{id}/reactivate", async (string id) =>
{
    await users.UpdateOneAsync(Db.IdFilter(id), Builders<BsonDocument>.Update.Combine(
        Builders<BsonDocument>.Update.Set("status", "active"),
        Builders<BsonDocument>.Update.Set("deletedAt", BsonNull.Value)));
    return Api.Ok(new { }, "User reactivated");
});
app.MapGet("/api/admin/audit-logs", async () =>
{
    var docs = await auditlogs.Find(Builders<BsonDocument>.Filter.Empty).Sort(Builders<BsonDocument>.Sort.Descending("createdAt")).Limit(200).ToListAsync();
    return Api.Ok(new { auditLogs = docs.Select(Shape.Doc).ToList() });
});
app.MapGet("/api/admin/reports/financial", () => Api.Ok(new { revenue = 0, volume = 0, generatedAt = DateTime.UtcNow }));
app.MapGet("/api/admin/export/transactions", async () =>
{
    var docs = await contributions.Find(Builders<BsonDocument>.Filter.Empty).Limit(1000).ToListAsync();
    return Api.Ok(new { transactions = docs.Select(Shape.Doc).ToList() });
});

app.MapFallback((HttpContext ctx) => Api.Fail($"Route {ctx.Request.Path} not found", 404));

app.Run();

static async Task Audit(IMongoCollection<BsonDocument> auditlogs, BsonValue actorId, string action, string resource, BsonValue resourceId, BsonValue groupId = null)
{
    try
    {
        var doc = new BsonDocument
        {
            ["actorId"] = actorId ?? BsonNull.Value,
            ["actorType"] = "user",
            ["action"] = action,
            ["resource"] = resource,
            ["resourceId"] = resourceId ?? BsonNull.Value,
            ["createdAt"] = DateTime.UtcNow,
            ["retentionCategory"] = "general"
        };
        if (groupId != null) doc["groupId"] = groupId;
        await auditlogs.InsertOneAsync(doc);
    }
    catch { }
}

static class Money
{
    public static Decimal128 D128(decimal value) => Decimal128.Parse(value.ToString(CultureInfo.InvariantCulture));
}

static class Env
{
    public static void Load()
    {
        foreach (var file in new[] { ".env", Path.Combine(AppContext.BaseDirectory, ".env") })
        {
            if (!File.Exists(file)) continue;
            foreach (var raw in File.ReadAllLines(file))
            {
                var line = raw.Trim();
                if (line.Length == 0 || line.StartsWith("#")) continue;
                var i = line.IndexOf('=');
                if (i <= 0) continue;
                var key = line[..i].Trim();
                var value = line[(i + 1)..].Trim().Trim('"');
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
    public static string Get(string key, string fallback = "") => Environment.GetEnvironmentVariable(key) ?? fallback;
}

static class Api
{
    public static IResult Ok(object data, string message = null, Dictionary<string, object> extra = null)
    {
        var body = new Dictionary<string, object> { ["success"] = true, ["data"] = data };
        if (message != null) body["message"] = message;
        if (extra != null) foreach (var kv in extra) body[kv.Key] = kv.Value;
        return Results.Json(body);
    }
    public static IResult Created(object data, string message = null, object topLevelExtras = null)
    {
        var body = new Dictionary<string, object> { ["success"] = true, ["data"] = data };
        if (message != null) body["message"] = message;
        if (topLevelExtras != null)
        {
            foreach (var prop in topLevelExtras.GetType().GetProperties()) body[prop.Name] = prop.GetValue(topLevelExtras);
        }
        return Results.Json(body, statusCode: 201);
    }
    public static IResult Fail(string message, int statusCode = 400) => Results.Json(new { success = false, message }, statusCode: statusCode);
}

static class Auth
{
    public static string UserId(HttpContext ctx, JwtService jwt)
    {
        var header = ctx.Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
        return jwt.TryGetUserId(header[7..].Trim());
    }
}

sealed class JwtService
{
    private readonly string _secret;
    private readonly int _minutes;
    public JwtService(string secret, int minutes)
    {
        _secret = string.IsNullOrWhiteSpace(secret) ? "development_secret_change_me" : secret;
        _minutes = minutes;
    }
    private SymmetricSecurityKey Key => new(Encoding.UTF8.GetBytes(_secret.PadRight(32, '0')[..Math.Max(32, _secret.Length)]));
    public string Generate(string userId)
    {
        var credentials = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(claims: new[] { new Claim("id", userId), new Claim(ClaimTypes.NameIdentifier, userId) }, expires: DateTime.UtcNow.AddMinutes(_minutes), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    public string TryGetUserId(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = Key,
                ClockSkew = TimeSpan.FromMinutes(2)
            }, out _);
            return principal.FindFirst("id")?.Value ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        catch { return null; }
    }
}

static class Db
{
    public static BsonValue IdValue(string id) => ObjectId.TryParse(id, out var oid) ? oid : (string.IsNullOrWhiteSpace(id) ? BsonNull.Value : id);
    public static FilterDefinition<BsonDocument> IdFilter(string id) => Builders<BsonDocument>.Filter.Eq("_id", IdValue(id));
}

static class Defaults
{
    public static BsonDocument UserSettings() => new()
    {
        ["notifications"] = new BsonDocument
        {
            ["email"] = true,
            ["push"] = true,
            ["sms"] = false,
            ["contributionReminders"] = true,
            ["payoutAlerts"] = true,
            ["groupUpdates"] = true
        },
        ["privacy"] = new BsonDocument { ["showProfileToNonMembers"] = true, ["showTrustScore"] = true }
    };
    public static BsonDocument ContributionStats() => new()
    {
        ["totalExpected"] = Decimal128.Zero,
        ["totalPaid"] = Decimal128.Zero,
        ["totalPending"] = Decimal128.Zero,
        ["totalMissed"] = Decimal128.Zero,
        ["onTimeCount"] = 0,
        ["lateCount"] = 0,
        ["missedCount"] = 0
    };
}

static class Json
{
    public static async Task<JsonElement> Read(HttpContext ctx)
    {
        if (ctx.Request.ContentLength == 0 || ctx.Request.Body == Stream.Null)
        {
            using var empty = JsonDocument.Parse("{}");
            return empty.RootElement.Clone();
        }
        try
        {
            using var doc = await JsonDocument.ParseAsync(ctx.Request.Body);
            return doc.RootElement.Clone();
        }
        catch
        {
            using var empty = JsonDocument.Parse("{}");
            return empty.RootElement.Clone();
        }
    }
    public static string Str(JsonElement obj, string key, string fallback = "") => obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(key, out var v) ? Any(v)?.ToString() ?? fallback : fallback;
    public static int Int(JsonElement obj, string key, int fallback = 0)
    {
        if (obj.ValueKind != JsonValueKind.Object || !obj.TryGetProperty(key, out var v)) return fallback;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i)) return i;
        return int.TryParse(Any(v)?.ToString(), out var parsed) ? parsed : fallback;
    }
    public static decimal Dec(JsonElement obj, string key, decimal fallback = 0)
    {
        if (obj.ValueKind != JsonValueKind.Object || !obj.TryGetProperty(key, out var v)) return fallback;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetDecimal(out var d)) return d;
        return decimal.TryParse(Any(v)?.ToString(), out var parsed) ? parsed : fallback;
    }
    public static bool Bool(JsonElement obj, string key, bool fallback = false)
    {
        if (obj.ValueKind != JsonValueKind.Object || !obj.TryGetProperty(key, out var v)) return fallback;
        if (v.ValueKind is JsonValueKind.True or JsonValueKind.False) return v.GetBoolean();
        return bool.TryParse(Any(v)?.ToString(), out var parsed) ? parsed : fallback;
    }
    public static object Any(JsonElement v) => v.ValueKind switch
    {
        JsonValueKind.String => v.GetString(),
        JsonValueKind.Number => v.TryGetInt64(out var l) ? l : v.TryGetDecimal(out var d) ? d : v.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => null,
        JsonValueKind.Array => v.EnumerateArray().Select(Any).ToList(),
        JsonValueKind.Object => v.EnumerateObject().ToDictionary(p => p.Name, p => Any(p.Value)),
        _ => null
    };
    public static BsonValue ToBson(JsonElement v) => v.ValueKind switch
    {
        JsonValueKind.String => v.GetString(),
        JsonValueKind.Number => v.TryGetInt64(out var l) ? new BsonInt64(l) : v.TryGetDecimal(out var d) ? new BsonDecimal128(Money.D128(d)) : new BsonDouble(v.GetDouble()),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => BsonNull.Value,
        JsonValueKind.Array => new BsonArray(v.EnumerateArray().Select(ToBson)),
        JsonValueKind.Object => new BsonDocument(v.EnumerateObject().Select(p => new BsonElement(p.Name, ToBson(p.Value)))),
        _ => BsonNull.Value
    };
    public static BsonArray ArrayOrEmpty(JsonElement obj, string key) => obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.Array ? ToBson(v).AsBsonArray : new BsonArray();
}

static class Shape
{
    public static Dictionary<string, object> UserSummary(BsonDocument user)
    {
        var profile = user.GetValue("profile", new BsonDocument()).AsBsonDocument;
        return new Dictionary<string, object>
        {
            ["_id"] = user.GetValue("_id", "").ToString(),
            ["email"] = user.GetValue("email", "").ToString(),
            ["phone"] = user.GetValue("phone", BsonNull.Value).IsBsonNull ? null : user.GetValue("phone").ToString(),
            ["firstName"] = profile.GetValue("firstName", "").ToString(),
            ["lastName"] = profile.GetValue("lastName", "").ToString(),
            ["displayName"] = profile.GetValue("displayName", DisplayName(user)).ToString(),
            ["emailVerified"] = user.GetValue("emailVerified", false).ToBoolean(),
            ["phoneVerified"] = user.GetValue("phoneVerified", false).ToBoolean(),
            ["profile"] = Doc(profile)
        };
    }
    public static string DisplayName(BsonDocument user)
    {
        var profile = user.GetValue("profile", new BsonDocument()).AsBsonDocument;
        var display = profile.GetValue("displayName", "").ToString();
        if (!string.IsNullOrWhiteSpace(display)) return display;
        return $"{profile.GetValue("firstName", "")} {profile.GetValue("lastName", "")}".Trim();
    }
    public static Dictionary<string, object> Group(BsonDocument group)
    {
        var d = Doc(group);
        var config = group.GetValue("config", new BsonDocument()).AsBsonDocument;
        var state = group.GetValue("state", new BsonDocument()).AsBsonDocument;
        d["status"] = state.GetValue("status", "draft").ToString();
        d["currentCycle"] = ToObj(state.GetValue("currentCycle", 0));
        d["filledSlots"] = ToObj(state.GetValue("filledSlots", 0));
        d["poolBalance"] = ToObj(state.GetValue("poolBalance", Decimal128.Zero));
        d["contributionAmount"] = ToObj(config.GetValue("contributionAmount", Decimal128.Zero));
        d["currency"] = config.GetValue("currency", "USD").ToString();
        d["frequency"] = config.GetValue("frequency", "monthly").ToString();
        d["totalSlots"] = ToObj(config.GetValue("totalSlots", 0));
        d["duration"] = ToObj(config.GetValue("duration", 0));
        d["payoutMethod"] = config.GetValue("payoutMethod", "fixed").ToString();
        return d;
    }
    public static async Task<Dictionary<string, object>> Contribution(BsonDocument c, IMongoCollection<BsonDocument> groups)
    {
        var d = Doc(c);
        var gid = c.GetValue("groupId", BsonNull.Value);
        if (!gid.IsBsonNull)
        {
            var g = await groups.Find(Builders<BsonDocument>.Filter.Eq("_id", gid)).FirstOrDefaultAsync();
            if (g != null) d["groupId"] = Group(g);
        }
        return d;
    }
    public static Dictionary<string, object> Doc(BsonDocument doc) => doc.Elements.ToDictionary(e => e.Name, e => ToObj(e.Value));
    public static List<object> Array(BsonArray arr) => arr.Select(ToObj).ToList();
    public static object ToObj(BsonValue v)
    {
        if (v == null || v.IsBsonNull) return null;
        if (v.IsObjectId) return v.AsObjectId.ToString();
        if (v.IsString) return v.AsString;
        if (v.IsBoolean) return v.AsBoolean;
        if (v.IsInt32) return v.AsInt32;
        if (v.IsInt64) return v.AsInt64;
        if (v.IsDouble) return v.AsDouble;
        if (v.IsDecimal128)
        {
            try { return Decimal128.ToDecimal(v.AsDecimal128); } catch { return v.ToString(); }
        }
        if (v.BsonType == BsonType.DateTime) return v.ToUniversalTime();
        if (v.IsBsonArray) return v.AsBsonArray.Select(ToObj).ToList();
        if (v.IsBsonDocument) return Doc(v.AsBsonDocument);
        return v.ToString();
    }
    public static decimal DecimalAt(BsonDocument doc, string path, decimal fallback)
    {
        var v = At(doc, path);
        if (v == null || v.IsBsonNull) return fallback;
        try
        {
            if (v.IsDecimal128) return Decimal128.ToDecimal(v.AsDecimal128);
            if (v.IsDouble) return (decimal)v.AsDouble;
            if (v.IsInt32) return v.AsInt32;
            if (v.IsInt64) return v.AsInt64;
            if (decimal.TryParse(v.ToString(), out var d)) return d;
        }
        catch { }
        return fallback;
    }
    public static int IntAt(BsonDocument doc, string path, int fallback)
    {
        var v = At(doc, path);
        if (v == null || v.IsBsonNull) return fallback;
        if (v.IsInt32) return v.AsInt32;
        if (v.IsInt64) return (int)v.AsInt64;
        return int.TryParse(v.ToString(), out var i) ? i : fallback;
    }
    private static BsonValue At(BsonDocument doc, string path)
    {
        BsonValue cur = doc;
        foreach (var part in path.Split('.'))
        {
            if (!cur.IsBsonDocument || !cur.AsBsonDocument.TryGetValue(part, out cur)) return null;
        }
        return cur;
    }
}
