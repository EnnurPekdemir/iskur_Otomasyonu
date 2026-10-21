using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using IskurOtomasyonu.Application;
using IskurOtomasyonu.Infrastructure;
using IskurOtomasyonu.WebApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller ve JSON Yapılandırması
builder.Services.AddControllers();

// 2. Katman Bağımlılıkları (Application & Infrastructure)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 3. JWT Bearer Kimlik Doğrulama Yapılandırması
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] 
    ?? "IskurTeknolojiFakultesiEnnurSecretKey2026!MustBeVeryLongAndSecureKey";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "IskurOtomasyonApi",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "IskurOtomasyonClient",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. CORS Politikası
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 5. Swagger / OpenAPI ve JWT Bearer Test Desteği
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu API",
        Version = "v1",
        Description = "İŞKUR öğrenci çalışma planı, dinamik QR devam takibi, izin yönetimi ve görev değerlendirme REST API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization başlığı: 'Bearer {token}' formatında giriniz.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 6. Global Hata Yakalama Middleware'i
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// 7. HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "İŞKUR Otomasyonu API v1");
        c.RoutePrefix = "swagger"; // Swagger /swagger adresinde açılsın
    });
}

app.UseHttpsRedirection();

// 8. Statik Dosyalar (SPA Dashboard UI)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
