namespace ProjectManagement.Api.DTOs;

public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ContributionAmount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Frequency { get; set; } = "monthly";
    public int TotalSlots { get; set; }
    public int Duration { get; set; }
    public string PayoutMethod { get; set; } = "fixed";
    public string Visibility { get; set; } = "public";
}

public class UpdateGroupRequest : CreateGroupRequest
{
    public string? Status { get; set; }
}
